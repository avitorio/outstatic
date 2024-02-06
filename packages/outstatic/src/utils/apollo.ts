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

async function getSession() {
  const response = await fetch('/api/outstatic/user')
  return response.json()
}

function createApolloClient(session?: Session | null) {
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
      : await getSession()
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
  session?: Session | null
) {
  // serve para verificar se já existe uma instância, para não criar outra
  const apolloClientGlobal = apolloClient ?? createApolloClient(session)

  // se a página usar o apolloClient no lado client
  // hidratamos o estado inicial aqui
  if (initialState) {
    apolloClientGlobal.cache.restore(initialState)
  }

  // sempre inicializando no SSR com cache limpo
  if (typeof window === 'undefined') return apolloClientGlobal
  // cria o apolloClient se estiver no client side
  apolloClient = apolloClient ?? apolloClientGlobal

  return apolloClient
}

export function useApollo(initialState = null, session?: Session) {
  const store = useMemo(
    () => initializeApollo(initialState, session),
    [initialState, session]
  )
  return store
}
