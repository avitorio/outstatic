import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import {
  QueryCache,
  QueryClient,
  keepPreviousData
} from '@tanstack/react-query'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { compress, decompress } from 'lz-string'
import { toast } from 'sonner'
import { ClientError } from 'graphql-request'
import { stringifyError } from '@/utils/errors/stringify-error'
import { isGithubCredentialsError } from '@/utils/errors/is-github-credentials-error'

// Whether this instance is running as part of the hosted Outstatic product
// (set by RootProvider from OutstaticData.isHosted). Self-hosted instances
// default to showing debugging affordances like "Copy Logs".
let isHostedInstance = false

export const setIsHosted = (value: boolean) => {
  isHostedInstance = value
}

// Create a client
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.state.error !== undefined) {
        // Check for 401/403 authentication errors
        // Note: GraphQL 401/403 errors are handled by the GraphQL interceptor
        // (see createGraphQLInterceptor.ts) before reaching here. This handler
        // serves as a fallback for non-GraphQL errors or cases where the
        // interceptor fails to refresh the token.
        if (error instanceof ClientError) {
          if (isGithubCredentialsError(error)) {
            // Silently handle auth errors - don't show toast or log
            // GraphQL interceptor handles refresh attempts, and if it fails,
            // the user should be redirected to login (handled elsewhere)
            return
          }

          toast.error(
            (error.response?.message as string) || 'Something went wrong',
            {
              id: 'error-toast'
            }
          )
        } else {
          const errorMessage =
            (query?.meta?.errorMessage as string) ||
            `Something went wrong: ${error.message}`
          console.error('Query error', { error, queryKey: query.queryKey })
          // The "Copy Logs" action is a debugging affordance meant for
          // self-hosted instances; hide it on the hosted product where
          // end users shouldn't be exposed to raw error internals.
          const errorToast = toast.error(errorMessage, {
            action: isHostedInstance
              ? undefined
              : {
                  label: 'Copy Logs',
                  onClick: () => {
                    navigator.clipboard.writeText(
                      `Query Key: ${JSON.stringify(
                        query.queryKey,
                        null,
                        '  '
                      )}\n\nError: ${stringifyError(error)}`
                    )
                    toast.message('Logs copied to clipboard', {
                      id: errorToast
                    })
                  }
                }
          })
        }
      }
    }
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      placeholderData: keepPreviousData,
      retry: (failureCount, error: any) => {
        // Don't retry for certain error responses
        if (
          error?.status === 400 ||
          error?.status === 401 ||
          error?.status === 403
        ) {
          return false
        }

        // Check if it's a GraphQL ClientError with 401/403
        if (error instanceof ClientError) {
          const status = error.response?.status
          if (status === 401 || status === 403) {
            return false
          }
        }

        // Retry others just once
        return failureCount <= 1
      }
    }
  }
})

persistQueryClient({
  queryClient,
  persister: createSyncStoragePersister({
    storage: !(typeof window === 'undefined') ? window.localStorage : undefined,
    serialize: (data) => compress(JSON.stringify(data)),
    deserialize: (data) => JSON.parse(decompress(data))
  }),
  maxAge: Infinity,
  dehydrateOptions: {
    // persist only offlineFirst queries
    shouldDehydrateQuery: (query) => {
      return !!query?.meta?.persist || false
    }
  }
})
