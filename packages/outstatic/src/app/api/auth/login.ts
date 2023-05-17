import {
  NextResponse,
  type NextFetchEvent,
  type NextRequest
} from 'next/server'
import { createEdgeRouter } from 'next-connect'
import { redirect } from 'next/navigation'
import { Request } from '../index'
const router = createEdgeRouter<Request, NextFetchEvent>()

export default async function GET() {
  redirect(
    `https://github.com/login/oauth/authorize?client_id=${process.env.OST_GITHUB_ID}&scope=repo%2C%20user&response_type=code`
  )
}
