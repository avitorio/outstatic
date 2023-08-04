import { redirect } from 'next/navigation'

export default async function GET() {
  const scopes = ['read:user', 'repo']

  redirect(
    `https://github.com/login/oauth/authorize?client_id=${
      process.env.OST_GITHUB_ID
    }&scope=${scopes.join('%20')}&response_type=code`
  )
}
