import { LoginSession, setLoginSession } from '@/utils/auth/auth';
import { OST_PRO_API_URL } from '@/utils/constants';
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import {
  SeamlessLoginCallbackSchema,
  SeamlessLoginExchangeResponseSchema,
} from './seamless-auth-schemas';

/**
 * @name GET
 * @description Seamless login callback handler for Outstatic instances
 *
 * Flow:
 * 1. Receive exchange_token from query parameters
 * 2. Exchange token with main API for session credentials
 * 3. Set session cookies
 * 4. Redirect to Outstatic dashboard
 *
 * This provides a one-click login experience when users navigate from
 * the main SaaS app to their self-hosted Outstatic instance.
 */
export default async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    // Validate query parameters with Zod
    const { exchange_token: exchangeToken } =
      SeamlessLoginCallbackSchema.parse(queryParams);

    // Build callback URL for validation (must match what was used during token creation)
    const callbackUrl = `${url.origin}${url.pathname}`;

    // Construct API URL
    const apiBase = OST_PRO_API_URL?.endsWith('/')
      ? OST_PRO_API_URL
      : `${OST_PRO_API_URL ?? ''}/`;

    const exchangeUrl = new URL('outstatic/auth/exchange-token', apiBase);

    // Exchange the one-time token for session tokens
    const response = await fetch(exchangeUrl.href, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        exchange_token: exchangeToken,
        callback_url: callbackUrl,
      }),
    });

    if (!response.ok) {
      console.error(
        'Failed to exchange token:',
        response.status,
        await response.text(),
      );

      return NextResponse.redirect(
        new URL('/outstatic?error=exchange_failed', request.url),
      );
    }

    const responseData = await response.json();

    // Validate API response structure with Zod
    const { user, session: sessionData } =
      SeamlessLoginExchangeResponseSchema.parse(responseData);

    // Create LoginSession object (same pattern as magic-link-callback)
    const session: LoginSession = {
      user: {
        name: user.name || user.email,
        login: user.email,
        email: user.email,
        image: user.avatar_url || '',
      },
      provider: 'seamless',
      access_token: sessionData.access_token,
      expires: new Date(sessionData.expires_at * 1000),
      refresh_token: sessionData.refresh_token,
      refresh_token_expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };

    // Store session cookie
    await setLoginSession(session);

    return NextResponse.redirect(
      new URL('/outstatic', request.url),
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      console.error('Seamless login callback validation error:', error.errors);
      return NextResponse.redirect(
        new URL('/outstatic?error=invalid_data', request.url),
      );
    }

    // Log unexpected errors for debugging
    console.error('Seamless login callback error:', error);

    return NextResponse.redirect(
      new URL('/outstatic?error=callback_error', request.url),
    );
  }
}
