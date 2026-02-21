import { GraphQLClient } from 'graphql-request'
import { useInitialData } from '@/utils/hooks/useInitialData'
import { createGraphQLInterceptor } from './createGraphQLInterceptor'
import { useRef, useMemo, useEffect, useState } from 'react'

type HeadersType = Record<string, string>

export function useCreateGraphQLClient(
  githubGql: string,
  headers: HeadersType
): GraphQLClient {
  const initialData = useInitialData()
  const basePath = initialData?.basePath || ''

  // Check if we're calling GitHub API directly
  const isGitHubAPI = githubGql.includes('api.github.com')

  // Use ref to store mutable headers that can be updated by interceptor
  const headersRef = useRef<HeadersType>({ ...headers })

  // Refs to hold callback functions - updated via useEffect to avoid ref access during render
  const callbacksRef = useRef<{
    getCurrentHeaders: () => HeadersType
    updateHeaders: (newHeaders: HeadersInit) => void
    onSessionUpdate: (session: { access_token?: string } | null) => void
  }>({
    getCurrentHeaders: () => headers,
    updateHeaders: () => {},
    onSessionUpdate: () => {}
  })

  // Compute current headers without reading from ref during render
  // GitHub API uses 'token' prefix, other APIs use 'Bearer'
  const currentHeaders = useMemo(() => {
    const authHeader =
      isGitHubAPI && headers.authorization.startsWith('Bearer ')
        ? headers.authorization.replace('Bearer ', 'token ')
        : headers.authorization

    // GitHub GraphQL API requires specific headers
    const githubHeaders: HeadersType = {
      ...headers,
      authorization: authHeader
    }

    if (isGitHubAPI) {
      githubHeaders['Accept'] = 'application/vnd.github.v4+json'
    } else {
      // For parser API, add project ID header if available
      if (initialData?.projectInfo?.projectId) {
        githubHeaders['x-project-id'] = initialData.projectInfo.projectId
      }
    }

    return githubHeaders
  }, [headers, isGitHubAPI, initialData])

  // Update refs outside render phase so interceptor has latest headers
  useEffect(() => {
    headersRef.current = currentHeaders

    // Update callback functions with current closure values
    callbacksRef.current = {
      getCurrentHeaders: () => headersRef.current,
      updateHeaders: (newHeaders) => {
        // Convert HeadersInit to Record<string, string>
        const newHeadersObj =
          newHeaders instanceof Headers
            ? Object.fromEntries(newHeaders.entries())
            : Array.isArray(newHeaders)
              ? Object.fromEntries(newHeaders)
              : newHeaders

        headersRef.current = { ...headersRef.current, ...newHeadersObj }
      },
      onSessionUpdate: (session) => {
        if (session?.access_token) {
          // GitHub API uses 'token' prefix, other APIs use 'Bearer'
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
