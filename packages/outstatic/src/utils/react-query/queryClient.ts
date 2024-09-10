import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { QueryCache, QueryClient } from '@tanstack/react-query'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { compress, decompress } from 'lz-string'
import { toast } from 'sonner'

// Create a client
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.state.error !== undefined) {
        toast.error(
          (query?.meta?.errorMessage as string) ||
            `Something went wrong: ${error.message}`
        )
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
