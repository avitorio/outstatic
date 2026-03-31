import {
  LoginSession,
  setLoginSession,
  AppPermissions,
  resolveRefreshTokenExpiry
} from '@/utils/auth/auth'
import {
  getAccessToken,
  fetchGitHubUser,
  checkCollaborator,
  checkCollaboratorWithRepo
} from '@/utils/auth/github'
import { OUTSTATIC_API_KEY, OUTSTATIC_API_URL } from '@/utils/constants'
import { NextRequest, NextResponse } from 'next/server'

type ProjectInfo = {
  repoOwner: string
  repoSlug: string
}

async function fetchProjectInfo(): Promise<ProjectInfo | null> {
  if (!OUTSTATIC_API_KEY) {
    return null
  }

  try {
    const apiBase = OUTSTATIC_API_URL?.endsWith('/')
      ? OUTSTATIC_API_URL
      : `${OUTSTATIC_API_URL ?? ''}/`
    const handshakeUrl = new URL('outstatic/project', apiBase)

    const response = await fetch(handshakeUrl.href, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${OUTSTATIC_API_KEY}`
      },
      cache: 'no-store'
    })

    if (response.ok) {
      const data = await response.json()
      return {
        repoOwner: data.repo_owner,
        repoSlug: data.repo_slug
      }
    }
    return null
  } catch {
    return null
  }
}

type ExchangeTokenResponse = {
  user: {
    id: string
    email: string
    login?: string
    name: string
    avatar_url: string
    permissions: AppPermissions[]
  }
  session: {
    access_token: string
    refresh_token: string
    expires_at: number
    refresh_token_expires_in?: number | null
    refresh_token_expires_at?: number | null
  }
}

async function exchangeToken(
  exchangeToken: string,
  callbackUrl: string
): Promise<ExchangeTokenResponse | null> {
  try {
    const apiBase = OUTSTATIC_API_URL?.endsWith('/')
      ? OUTSTATIC_API_URL
      : `${OUTSTATIC_API_URL ?? ''}/`
    const exchangeUrl = new URL('outstatic/auth/exchange-token', apiBase)

    const response = await fetch(exchangeUrl.href, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        exchange_token: exchangeToken,
        callback_url: callbackUrl
      })
    })

    if (!response.ok) {
      console.error('Relay token exchange returned a non-OK response', {
        status: response.status,
        statusText: response.statusText
      })
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Relay token exchange request failed', error)
    return null
  }
}

export default async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const error = url.searchParams.get('error')
  const basePath = (process.env.OST_BASE_PATH || '').replace(/\/+$/, '')
  const origin = url.origin
  const dashboardUrl = `${origin}${basePath}/outstatic`

  // Handle GitHub and relay errors
  if (error) {
    const errorUrl = new URL(dashboardUrl)
    errorUrl.searchParams.set('error', error)
    return NextResponse.redirect(errorUrl)
  }

  const relayExchangeToken = url.searchParams.get('exchange_token')
  if (relayExchangeToken) {
    const callbackUrl = `${origin}${basePath}/api/outstatic/callback`
    const exchangeResult = await exchangeToken(relayExchangeToken, callbackUrl)

    if (!exchangeResult) {
      console.error('Failed to exchange relay token from callback query params')
      const errorUrl = new URL(dashboardUrl)
      errorUrl.searchParams.set('error', 'session-error')
      return NextResponse.redirect(errorUrl)
    }

    const sessionData: LoginSession = {
      user: {
        name: exchangeResult.user.name || exchangeResult.user.email,
        login: exchangeResult.user.login || exchangeResult.user.email,
        email: exchangeResult.user.email,
        image: exchangeResult.user.avatar_url || '',
        permissions: exchangeResult.user.permissions || []
      },
      provider: 'magic-link',
      access_token: exchangeResult.session.access_token,
      refresh_token: exchangeResult.session.refresh_token,
      expires: new Date(exchangeResult.session.expires_at * 1000),
      refresh_token_expires: resolveRefreshTokenExpiry(exchangeResult.session)
    }

    await setLoginSession(sessionData)
    return NextResponse.redirect(dashboardUrl)
  }

  const code = url.searchParams.get('code') as string | null
  if (!code) {
    return NextResponse.json({ error: 'missing_code' }, { status: 400 })
  }

  try {
    const {
      access_token,
      refresh_token,
      expires_in,
      refresh_token_expires_in
    } = await getAccessToken({ code })

    if (!access_token) {
      return NextResponse.json({ error: 'no_access_token' }, { status: 401 })
    }

    let userData = await fetchGitHubUser(access_token)

    // If email is missing, fetch from /user/emails
    if (!userData.email) {
      const emails = await (
        await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `token ${access_token}`
          }
        })
      ).json()

      if (Array.isArray(emails) && emails.length > 0) {
        const primary = emails.find((email: any) => email.primary)
        userData.email = primary ? primary.email : emails[0].email
      }
    }

    if (userData && userData.email && access_token) {
      const { name, login, email, avatar_url } = userData

      // Fetch project info from SaaS to get repo owner/slug
      const projectInfo = await fetchProjectInfo()

      // Determine which repo to check collaborator status against
      const repoOwner =
        projectInfo?.repoOwner || process.env.OST_REPO_OWNER || ''
      const repoSlug =
        projectInfo?.repoSlug ||
        process.env.OST_REPO_SLUG ||
        process.env.VERCEL_GIT_REPO_SLUG ||
        ''

      // Check if user is a collaborator on the repository
      let isCollaborator: boolean
      if (projectInfo) {
        // Use project info from SaaS
        isCollaborator = await checkCollaboratorWithRepo(
          access_token,
          login,
          repoOwner,
          repoSlug
        )
      } else {
        // Fall back to env var based check
        isCollaborator = await checkCollaborator(access_token, login)
      }

      if (isCollaborator) {
        // Collaborators get full permissions and use GitHub provider
        const permissions: AppPermissions[] = [
          'roles.manage',
          'settings.manage',
          'content.manage',
          'collections.manage',
          'members.manage',
          'invites.manage',
          'projects.manage'
        ]

        const sessionData: LoginSession = {
          user: {
            name: name || '',
            login,
            email,
            image: avatar_url || '',
            permissions
          },
          provider: 'github',
          access_token,
          refresh_token,
          expires: new Date(Date.now() + expires_in),
          refresh_token_expires: refresh_token_expires_in
            ? new Date(Date.now() + refresh_token_expires_in)
            : undefined
        }
        await setLoginSession(sessionData)
        return NextResponse.redirect(dashboardUrl)
      }

      // Not a collaborator - validate against SaaS to check project membership
      if (!OUTSTATIC_API_KEY) {
        const redirectUrl = `${origin}${basePath}/outstatic?error=not-collaborator`
        return NextResponse.redirect(redirectUrl)
      }

      const apiBase = OUTSTATIC_API_URL?.endsWith('/')
        ? OUTSTATIC_API_URL
        : `${OUTSTATIC_API_URL ?? ''}/`

      try {
        const validateUrl = new URL(
          'outstatic/auth/validate-github-user',
          apiBase
        )
        const callbackUrl = `${origin}${basePath}/api/outstatic/callback`

        const validateResponse = await fetch(validateUrl.href, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OUTSTATIC_API_KEY}`
          },
          body: JSON.stringify({
            github_token: access_token,
            callback_url: callbackUrl
          })
        })

        if (!validateResponse.ok) {
          const redirectUrl = `${dashboardUrl}?error=not-collaborator`
          return NextResponse.redirect(redirectUrl)
        }

        const validation = await validateResponse.json()

        if (!validation.valid || !validation.exchange_token) {
          const redirectUrl = `${dashboardUrl}?error=not-collaborator`
          return NextResponse.redirect(redirectUrl)
        }

        // Exchange the token for a Supabase session
        const exchangeResult = await exchangeToken(
          validation.exchange_token,
          callbackUrl
        )

        if (!exchangeResult) {
          console.error(
            'Failed to exchange relay token after GitHub user validation'
          )
          const redirectUrl = `${dashboardUrl}?error=session-error`
          return NextResponse.redirect(redirectUrl)
        }

        // Create session with magic-link provider to use parser endpoint
        const sessionData: LoginSession = {
          user: {
            name: validation.user.name || exchangeResult.user.name || email,
            login: validation.user.login || exchangeResult.user.login || email,
            email: exchangeResult.user.email,
            image:
              validation.user.avatar_url ||
              exchangeResult.user.avatar_url ||
              '',
            permissions: exchangeResult.user.permissions || []
          },
          provider: 'magic-link', // This makes the client use the parser endpoint
          access_token: exchangeResult.session.access_token,
          refresh_token: exchangeResult.session.refresh_token,
          expires: new Date(exchangeResult.session.expires_at * 1000),
          refresh_token_expires: resolveRefreshTokenExpiry(
            exchangeResult.session
          )
        }

        await setLoginSession(sessionData)
        return NextResponse.redirect(dashboardUrl)
      } catch {
        const redirectUrl = `${dashboardUrl}?error=not-collaborator`
        return NextResponse.redirect(redirectUrl)
      }
    } else {
      return NextResponse.json({ error: 'missing_user_data' }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: 'auth_callback_failed' }, { status: 500 })
  }
}
