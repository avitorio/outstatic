import { GraphQLClient } from 'graphql-request'
import { GITHUB_GQL_API_URL } from '@/utils/constants'
import { useCsrfToken } from '@/utils/hooks/useCsrfToken'

type HeadersType = {
  authorization: string
  'X-CSRF-Token'?: string
}

export function useCreateGraphQLClient(
  githubGql: string,
  headers: HeadersType
): GraphQLClient {
  const csrfToken = useCsrfToken()

  if (githubGql !== GITHUB_GQL_API_URL && csrfToken) {
    // eslint-disable-next-line react-hooks/immutability
    headers['X-CSRF-Token'] = csrfToken
  }

  return new GraphQLClient(githubGql, { headers })
}
