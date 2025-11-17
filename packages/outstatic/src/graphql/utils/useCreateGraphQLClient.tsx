import { GraphQLClient } from 'graphql-request'
import { useInitialData } from '@/utils/hooks/useInitialData'
import { createGraphQLInterceptor } from './createGraphQLInterceptor'
import { useRef, useMemo } from 'react'

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

  // Update headers ref when authorization changes
  // GitHub API uses 'token' prefix, other APIs use 'Bearer'
  const currentHeaders = useMemo(() => {
    const authHeader = isGitHubAPI && headers.authorization.startsWith('Bearer ')
      ? headers.authorization.replace('Bearer ', 'token ')
      : headers.authorization

    // GitHub GraphQL API requires specific headers
    const githubHeaders: HeadersType = {
      ...headersRef.current,
      authorization: authHeader
    }

    if (isGitHubAPI) {
      // Add GitHub-specific headers if not already present
      if (!githubHeaders['User-Agent']) {
        githubHeaders['User-Agent'] = 'Outstatic-GitHub-API'
      }
      if (!githubHeaders['Accept']) {
        githubHeaders['Accept'] = 'application/vnd.github.v4+json'
      }
    }

    headersRef.current = githubHeaders

    return headersRef.current
  }, [headers.authorization, githubGql, isGitHubAPI])

  // Create GraphQL client with interceptor
  const client = useMemo(() => {
    const graphQLClient = new GraphQLClient(githubGql, { headers: currentHeaders })

    // Wrap with interceptor for automatic token refresh
    return createGraphQLInterceptor(graphQLClient, {
      basePath,
      endpoint: githubGql,
      getCurrentHeaders: () => headersRef.current,
      updateHeaders: (newHeaders) => {
        // Convert HeadersInit to Record<string, string>
        const newHeadersObj = newHeaders instanceof Headers
          ? Object.fromEntries(newHeaders.entries())
          : Array.isArray(newHeaders)
            ? Object.fromEntries(newHeaders)
            : newHeaders

        headersRef.current = { ...headersRef.current, ...newHeadersObj }
        // Headers will be used on next request via getCurrentHeaders
      },
      onSessionUpdate: (session) => {
        // Update headers with new token
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
    })
  }, [githubGql, basePath, currentHeaders, isGitHubAPI])

  return client
}
