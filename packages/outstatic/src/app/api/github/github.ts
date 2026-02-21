import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import {
  getLoginSession,
  refreshTokenIfNeeded,
  LoginSession
} from '@/utils/auth/auth'

// Zod schema for GitHub REST API request validation
const GitHubRestRequestSchema = z.object({
  endpoint: z.string().optional(), // Made optional to support path-based routing
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('GET'),
  body: z.any().optional(),
  headers: z.record(z.string()).optional()
})

type GitHubRestRequest = z.infer<typeof GitHubRestRequestSchema>

async function handleGitHubRequest(
  request: NextRequest & { remainingPath?: string[] }
) {
  try {
    let validatedRequest: GitHubRestRequest

    // For GET requests, parse query parameters and URL path
    if (request.method === 'GET') {
      const url = new URL(request.url)
      const searchParams = url.searchParams

      validatedRequest = {
        method: 'GET' as const,
        endpoint: undefined, // Will be determined from path
        headers: Object.fromEntries(
          Array.from(searchParams.entries())
            .filter(([key]) => key.startsWith('header-'))
            .map(([key, value]) => [key.replace('header-', ''), value])
        )
      }
    } else {
      // For POST/PUT/PATCH/DELETE requests, parse JSON body
      const body = await request.json()
      validatedRequest = GitHubRestRequestSchema.parse(body)
    }

    // Determine the GitHub API endpoint
    let githubEndpoint: string

    if (validatedRequest.endpoint) {
      // Use endpoint from request body (legacy support)
      githubEndpoint = validatedRequest.endpoint
    } else if (request.remainingPath && request.remainingPath.length > 0) {
      // Use path-based routing from URL segments
      githubEndpoint = '/' + request.remainingPath.join('/')
    } else {
      return NextResponse.json(
        {
          error:
            'GitHub endpoint is required either in request body or URL path'
        },
        { status: 400 }
      )
    }

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

    // Prepare headers for GitHub REST API request
    const headers: Record<string, string> = {
      Authorization: `token ${currentSession.access_token}`,
      'User-Agent': 'Outstatic-GitHub-API',
      Accept: 'application/vnd.github.v3+json'
    }

    // Merge any additional headers from the request
    if (validatedRequest.headers) {
      Object.assign(headers, validatedRequest.headers)
    }

    // Build GitHub URL with query parameters for GET requests
    let githubUrl = `https://api.github.com${githubEndpoint}`
    if (request.method === 'GET') {
      const url = new URL(request.url)
      const queryParams = new URLSearchParams()

      // Add all non-header query parameters to the GitHub request
      for (const [key, value] of url.searchParams.entries()) {
        if (!key.startsWith('header-')) {
          queryParams.append(key, value)
        }
      }

      if (queryParams.toString()) {
        githubUrl += '?' + queryParams.toString()
      }
    }

    const requestOptions: RequestInit = {
      method: validatedRequest.method,
      headers
    }

    // Add body if provided
    if (
      validatedRequest.body &&
      ['POST', 'PUT', 'PATCH'].includes(validatedRequest.method)
    ) {
      requestOptions.body = JSON.stringify(validatedRequest.body)
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
    console.error('GitHub REST API error:', error)

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

// Export both GET and POST handlers
export async function POST(
  request: NextRequest & { remainingPath?: string[] }
) {
  return handleGitHubRequest(request)
}

export async function GET(request: NextRequest & { remainingPath?: string[] }) {
  return handleGitHubRequest(request)
}
