import { redirect } from 'next/navigation'

export default async function GET() {
  const scopes = ['read:user', 'user:email', 'repo']

  const url = new URL('https://github.com/login/oauth/authorize')

  url.searchParams.append('client_id', process.env.OST_GITHUB_ID ?? '')
  url.searchParams.append('scope', scopes.join(','))
  url.searchParams.append('response_type', 'code')
  if (process.env?.OST_GITHUB_CALLBACK_URL) {
    url.searchParams.append('redirect_uri', process.env.OST_GITHUB_CALLBACK_URL)
  }

  redirect(url.toString())
}
