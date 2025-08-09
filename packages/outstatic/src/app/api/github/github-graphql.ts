import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import {
  getLoginSession,
  refreshTokenIfNeeded,
  LoginSession
} from '@/utils/auth/auth'

// Zod schema for GitHub GraphQL request validation
const GitHubGraphQLRequestSchema = z.object({
  operationName: z.string().optional(),
  query: z.string().min(1, 'GraphQL query is required'),
  variables: z.record(z.any()).optional()
})

export default async function POST(request: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await request.json()
    const validatedRequest = GitHubGraphQLRequestSchema.parse(body)

    // Get the current session
    const session = await getLoginSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if token is expired and refresh if needed (handles concurrent requests)
    let currentSession: LoginSession
    try {
      currentSession = await refreshTokenIfNeeded(session)
    } catch (refreshError) {
      return NextResponse.json(
        {
          error:
            refreshError instanceof Error
              ? refreshError.message
              : 'Token refresh failed'
        },
        { status: 401 }
      )
    }

    // Prepare headers for GitHub GraphQL API request
    const headers: Record<string, string> = {
      Authorization: `token ${currentSession.access_token}`,
      'User-Agent': 'Outstatic-GitHub-API',
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v4+json'
    }

    const githubUrl = 'https://api.github.com/graphql'
    const requestOptions: RequestInit = {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: validatedRequest.query,
        variables: validatedRequest.variables || {},
        operationName: validatedRequest.operationName
      })
    }

    const response = await fetch(githubUrl, requestOptions)
    const responseData = await response.json()

    // Check if the GitHub API request was successful
    if (!response.ok) {
      return NextResponse.json(responseData, { status: response.status })
    }

    // Return the exact GitHub response
    return NextResponse.json(responseData, { status: response.status })
  } catch (error) {
    console.error('GitHub GraphQL API error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
