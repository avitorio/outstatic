import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { QueryCache, QueryClient, keepPreviousData } from '@tanstack/react-query'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { compress, decompress } from 'lz-string'
import { toast } from 'sonner'
import { ClientError } from 'graphql-request'

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
        const isAuthError =
          (error instanceof ClientError &&
            (error.response?.status === 401 || error.response?.status === 403)) ||
          (error && typeof error === 'object' && 'status' in error &&
            (error.status === 401 || error.status === 403))

        if (isAuthError) {
          // Silently handle auth errors - don't show toast or log
          // GraphQL interceptor handles refresh attempts, and if it fails,
          // the user should be redirected to login (handled elsewhere)
          return
        }

        // Handle other errors with toast notifications
        console.error('queryClient error', error, query)
        toast.error(
          (query?.meta?.errorMessage as string) ||
          `Something went wrong: ${error.message}`
        )
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
