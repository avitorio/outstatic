import { MAX_AGE } from '@/utils/constants'

export async function getAccessToken(
  code:
    | { code: string }
    | { refresh_token: string; grant_type: 'refresh_token' }
) {
  const request = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: process.env.OST_GITHUB_ID,
      client_secret: process.env.OST_GITHUB_SECRET,
      ...code
    })
  })
  const text = await request.text()
  const params = new URLSearchParams(text)
  return {
    access_token: params.get('access_token'),
    expires_in:
      (params.get('expires_in')
        ? parseInt(params.get('expires_in')!)
        : MAX_AGE) * 1000,
    refresh_token: params.get('refresh_token') || undefined,
    refresh_token_expires_in: params.get('refresh_token_expires_in')
      ? parseInt(params.get('refresh_token_expires_in')!) * 1000
      : undefined
  }
}

export async function fetchGitHubUser(token: string) {
  const request = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: 'token ' + token
    }
  })
  return await request.json()
}

export async function checkRepository(token: string, userName: string) {
  const repoOwner = process.env.OST_REPO_OWNER || userName
  const repoSlug =
    process.env.OST_REPO_SLUG || process.env.VERCEL_GIT_REPO_SLUG || ''
  const response = await fetch(
    `https://api.github.com/repos/${repoOwner}/${repoSlug}`,
    {
      headers: {
        Authorization: `token ${token}`
      }
    }
  )
  return response.status === 200
}

export async function checkCollaborator(token: string, userName: string) {
  const repoSlug =
    process.env.OST_REPO_SLUG || process.env.VERCEL_GIT_REPO_SLUG || ''
  if (process.env.OST_REPO_OWNER) {
    const response = await fetch(
      `https://api.github.com/repos/${process.env.OST_REPO_OWNER}/${repoSlug}/collaborators/${userName}`,
      {
        headers: {
          Authorization: `token ${token}`
        }
      }
    )
    if (response.status !== 204) return false
  }
  return true
}
