import { redirect } from 'next/navigation'

export default async function GET() {
  redirect(
    `https://github.com/login/oauth/authorize?client_id=${process.env.OST_GITHUB_ID}&scope=repo%2C%20user&response_type=code`
  )
}
