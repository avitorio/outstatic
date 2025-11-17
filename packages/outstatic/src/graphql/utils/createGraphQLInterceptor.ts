import { GraphQLClient, ClientError, RequestDocument, Variables } from 'graphql-request'
import { refreshTokenWithCoordination } from './tokenRefreshUtility'
import { getSessionUpdateCallback } from '@/utils/hooks/useInitialData'

type InterceptorOptions = {
  basePath?: string
  endpoint?: string
  getCurrentHeaders: () => HeadersInit
  updateHeaders: (newHeaders: HeadersInit) => void
  onSessionUpdate?: (session: any) => void
}

/**
 * Creates a GraphQL client with automatic token refresh interceptor
 * 
 * Wraps the GraphQLClient.request method to intercept 401/403 errors,
 * refresh the token, and retry the original request.
 */
export function createGraphQLInterceptor(
  client: GraphQLClient,
  options: InterceptorOptions
): GraphQLClient {
  const { basePath, endpoint, getCurrentHeaders, updateHeaders, onSessionUpdate } = options

  // Store original request method
  const originalRequest = client.request.bind(client)

  // Create wrapper that intercepts errors
  // Match GraphQLClient.request signature overloads
  const interceptedRequest = async <T = any, V extends Variables = Variables>(
    document: RequestDocument,
    ...variablesAndRequestHeaders: V extends Record<string, never>
      ? []
      : [variables: V, requestHeaders?: HeadersInit]
  ): Promise<T> => {
    let attemptCount = 0
    const maxAttempts = 2 // Original + one retry after refresh

    while (attemptCount < maxAttempts) {
      try {
        // Extract variables and headers from arguments
        const variables = variablesAndRequestHeaders[0] as V | undefined
        const requestHeaders = variablesAndRequestHeaders[1] as HeadersInit | undefined

        // Merge current headers with request headers
        const headers = {
          ...getCurrentHeaders(),
          ...requestHeaders
        }

        // Make the request - use type assertion to handle GraphQLClient.request overloads
        let result: T
        if (variables !== undefined) {
          result = await (originalRequest as any)(document, variables, headers)
        } else {
          result = await (originalRequest as any)(document, headers)
        }
        return result
      } catch (error) {
        // Check if it's a 401/403 error that we should handle
        if (error instanceof ClientError) {
          const status = error.response?.status
          const isAuthError = status === 401 || status === 403

          // Only handle auth errors on first attempt
          if (isAuthError && attemptCount === 0) {
            try {
              // Get session update callback from global registry or use provided one
              const sessionUpdate = onSessionUpdate || getSessionUpdateCallback()

              // Attempt to refresh token
              const newSession = await refreshTokenWithCoordination({
                basePath,
                onSessionUpdate: sessionUpdate || undefined
              })

              // Update headers with new token
              if (newSession?.access_token) {
                const currentHeaders = getCurrentHeaders() as Record<string, string>
                // GitHub API uses 'token' prefix, not 'Bearer'
                const isGitHubAPI = endpoint?.includes('api.github.com') ?? false
                const authHeader = isGitHubAPI
                  ? `token ${newSession.access_token}`
                  : `Bearer ${newSession.access_token}`

                updateHeaders({
                  ...currentHeaders,
                  authorization: authHeader
                })
              }

              // Retry the request with updated headers
              attemptCount++
              continue
            } catch (refreshError) {
              // If refresh fails, throw the original error
              // This will propagate to React Query error handler
              throw error
            }
          }
        }

        // For non-auth errors or if refresh failed, throw the error
        throw error
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new Error('Max retry attempts exceeded')
  }

  // Replace the request method
  client.request = interceptedRequest as any

  return client
}

