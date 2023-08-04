import { redirect } from 'next/navigation'

export default async function GET() {
  const scopes = ['read:user', 'repo']

  const url = new URL('https://github.com/login/oauth/authorize')

  url.searchParams.append('client_id', process.env.OST_GITHUB_ID ?? '')
  url.searchParams.append('scopes', scopes.join(' '))
  url.searchParams.append('response_type', 'code')

  redirect(url.toString())
}
