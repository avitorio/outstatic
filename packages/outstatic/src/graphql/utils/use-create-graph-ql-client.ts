import { GraphQLClient } from 'graphql-request'
import { useInitialData } from '@/utils/hooks/use-initial-data'
import { createGraphQLInterceptor } from './create-graph-ql-interceptor'
import { useRef, useMemo, useEffect, useState } from 'react'

type HeadersType = Record<string, string>

function normalizeHeaders(newHeaders: HeadersInit): HeadersType {
  if (newHeaders instanceof Headers) {
    return Object.fromEntries(newHeaders.entries())
  }

  if (Array.isArray(newHeaders)) {
    return Object.fromEntries(newHeaders)
  }

  return newHeaders
}

export function useCreateGraphQLClient(
  githubGql: string,
  headers: HeadersType
): GraphQLClient {
  const initialData = useInitialData()
  const basePath = initialData?.basePath || ''

  // Check if we're calling GitHub API directly
  const isGitHubAPI = githubGql.includes('api.github.com')

  // Compute current headers without reading from ref during render
  // GitHub API uses 'token' prefix, other APIs use 'Bearer'
  const currentHeaders = useMemo(() => {
    const authHeader =
      isGitHubAPI && headers.authorization.startsWith('Bearer ')
        ? headers.authorization.replace('Bearer ', 'token ')
        : headers.authorization

    const computed: HeadersType = {
      ...headers,
      authorization: authHeader
    }

    if (isGitHubAPI) {
      computed['Accept'] = 'application/vnd.github.v4+json'
    } else if (initialData?.projectInfo?.projectId) {
      computed['x-project-id'] = initialData.projectInfo.projectId
    }

    return computed
  }, [headers, isGitHubAPI, initialData])

  const headersRef = useRef<HeadersType>(currentHeaders)

  const callbacksRef = useRef<{
    getCurrentHeaders: () => HeadersType
    updateHeaders: (newHeaders: HeadersInit) => void
    onSessionUpdate: (session: { access_token?: string } | null) => void
  }>({
    getCurrentHeaders: () => headersRef.current,
    updateHeaders: (newHeaders) => {
      headersRef.current = {
        ...headersRef.current,
        ...normalizeHeaders(newHeaders)
      }
    },
    onSessionUpdate: (session) => {
      if (session?.access_token) {
        const authHeader = isGitHubAPI
          ? `token ${session.access_token}`
          : `Bearer ${session.access_token}`

        headersRef.current = {
          ...headersRef.current,
          authorization: authHeader
        }
      }
    }
  })

  // Update refs outside render phase so interceptor has latest headers
  useEffect(() => {
    headersRef.current = currentHeaders

    callbacksRef.current = {
      getCurrentHeaders: () => headersRef.current,
      updateHeaders: (newHeaders) => {
        headersRef.current = {
          ...headersRef.current,
          ...normalizeHeaders(newHeaders)
        }
      },
      onSessionUpdate: (session) => {
        if (session?.access_token) {
          const authHeader = isGitHubAPI
            ? `token ${session.access_token}`
            : `Bearer ${session.access_token}`

          headersRef.current = {
            ...headersRef.current,
            authorization: authHeader
          }
        }
      }
    }
  }, [currentHeaders, isGitHubAPI])

  // Create stable wrapper functions once at mount using useState lazy initializer
  // These delegate to callbacksRef which is updated in useEffect
  const [stableCallbacks] = useState(() => ({
    getCurrentHeaders: () => callbacksRef.current.getCurrentHeaders(),
    updateHeaders: (newHeaders: HeadersInit) =>
      callbacksRef.current.updateHeaders(newHeaders),
    onSessionUpdate: (session: { access_token?: string } | null) =>
      callbacksRef.current.onSessionUpdate(session)
  }))

  // Create GraphQL client with interceptor
  const client = useMemo(() => {
    const graphQLClient = new GraphQLClient(githubGql, {
      headers: currentHeaders
    })

    // Wrap with interceptor for automatic token refresh
    // Use stable callbacks that delegate to the latest implementations
    return createGraphQLInterceptor(graphQLClient, {
      basePath,
      endpoint: githubGql,
      getCurrentHeaders: stableCallbacks.getCurrentHeaders,
      updateHeaders: stableCallbacks.updateHeaders,
      onSessionUpdate: stableCallbacks.onSessionUpdate
    })
  }, [githubGql, basePath, currentHeaders, stableCallbacks])

  return client
}
