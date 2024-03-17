import { Session } from '@/types'
import {
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject,
  createHttpLink,
  from
} from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import fetch from 'cross-fetch'
import { useMemo } from 'react'

let apolloClient: ApolloClient<NormalizedCacheObject | null>

const apolloCache = new InMemoryCache({
  typePolicies: {}
})

async function getSession(basePath = '') {
  const response = await fetch(basePath + '/api/outstatic/user')
  return response.json()
}

function createApolloClient(session?: Session | null, basePath?: string) {
  const httpLink = createHttpLink({
    uri: 'https://api.github.com/graphql',
    // Prefer explicit `window.fetch` when available so that outgoing requests
    // are captured and deferred until the Service Worker is ready. If no window
    // or window.fetch, default to cross-fetch's ponyfill
    fetch: (...args) =>
      (typeof window !== 'undefined' && typeof window.fetch === 'function'
        ? window.fetch
        : fetch)(...args)
  })

  const authLink = setContext(async (_, { headers }) => {
    const data: { session: Session } = session
      ? { session }
      : await getSession(basePath)
    const modifiedHeader = {
      headers: {
        ...headers,
        authorization: data.session?.access_token
          ? `Bearer ${data.session.access_token}`
          : ''
      }
    }
    return modifiedHeader
  })

  return new ApolloClient({
    ssrMode: typeof window === 'undefined',
    link: from([authLink, httpLink]),
    cache: apolloCache
  })
}

export function initializeApollo(
  initialState = null,
  session?: Session | null,
  basePath = ''
) {
  // check if there is already an instance, so as not to create another
  const apolloClientGlobal =
    apolloClient ?? createApolloClient(session, basePath)

  // if the page uses apolloClient on the client side
  // hydrate the initial state here
  if (initialState) {
    apolloClientGlobal.cache.restore(initialState)
  }

  // always initialize with a new cache on the server side
  if (typeof window === 'undefined') return apolloClientGlobal
  // creates apolloClient if it is on the client side
  apolloClient = apolloClient ?? apolloClientGlobal

  return apolloClient
}

export function useApollo(
  initialState = null,
  session?: Session,
  basePath?: string
) {
  const store = useMemo(
    () => initializeApollo(initialState, session, basePath),
    [initialState, session, basePath]
  )
  return store
}
