type ErrorWithOptionalResponse = {
  response?: {
    status?: number
    message?: unknown
  }
}

export function isGithubCredentialsError(error: unknown): boolean {
  const response =
    typeof error === 'object' && error !== null && 'response' in error
      ? (error as ErrorWithOptionalResponse).response
      : undefined

  const status = response?.status
  const message = response?.message

  return (
    (status === 401 || status === 403) &&
    typeof message === 'string' &&
    message.includes('credentials')
  )
}
