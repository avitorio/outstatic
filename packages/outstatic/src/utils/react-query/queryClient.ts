import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { QueryCache, QueryClient } from '@tanstack/react-query'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { compress, decompress } from 'lz-string'
import { toast } from 'sonner'
import { ClientError } from 'graphql-request'

// Create a client
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.state.error !== undefined) {
        if (error instanceof ClientError && error.response.status === 401) {
          // Check if it's a token refresh failure - don't log these to console
          const isTokenRefreshError =
            error.response?.error === 'Token refresh failed' ||
            error.message?.includes('Token refresh failed')

          if (!isTokenRefreshError) {
            console.log('401 error - queryClient', error, query)
          }
          return
        } else {
          console.error('queryClient error', error, query)
          toast.error(
            (query?.meta?.errorMessage as string) ||
              `Something went wrong: ${error.message}`
          )
        }
      }
    }
  }),
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24 * 24 // 24 days
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
