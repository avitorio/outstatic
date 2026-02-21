---
title: "API Keys"
status: "published"
author:
  name: "Andre Vitorio"
  picture: "https://avatars.githubusercontent.com/u/1417109?v=4"
slug: "api-keys"
description: "Learn how API keys work and unlock PRO features for your self-hosted Outstatic instance."
coverImage: ""
publishedAt: "2025-02-03T12:00:00.000Z"
---

## What are API Keys?

API keys are part of the **Outstatic Pro plan**. They unlock advanced features for your self-hosted Outstatic instance. Each project can have one active API key at a time.

## How API Keys Work

When you generate an API key from your project's API Key settings in the Outstatic dashboard, you receive a secret key that authenticates your self-hosted instance with Outstatic's services. You add this key to your `.env` file:

```bash
OUTSTATIC_API_KEY=your_api_key_here
```

Once configured, your self-hosted Outstatic instance can access PRO features. The key is validated on each request to ensure only authorized projects can use these capabilities.

**Important:** Save your API key securely when it's first generated. You won't be able to see the full key again—only a prefix for identification. If you lose it, you'll need to regenerate a new key (which will revoke the old one).

## PRO Features Unlocked

With a valid API key, your self-hosted Outstatic instance gains access to:

- **AI Completions** — AI-powered writing suggestions in the content editor (requires `OPENAI_API_KEY` as well)
- **Email and social login** — Invite team members who can sign in with email or social providers (GitHub, Google, etc.)
- **GitHub relay login** — Let users sign in with GitHub without creating local `OST_GITHUB_ID` / `OST_GITHUB_SECRET` credentials
- **Advanced authentication** — Configure callback origins so members are redirected only to approved self-hosted domains
- **Project members management** — Manage your project's members and their roles

## Getting an API Key

1. Sign in to [outstatic.com](https://outstatic.com) and open your project.
2. Go to the **API Key** tab in your project settings.
3. In **Step 1**, add at least one Callback Origin base URL ending in `/outstatic`.
4. As soon as the first Callback Origin is added, the UI moves to **Step 2** automatically. You can still go back to Step 1 anytime.
5. In **Step 2**, click **Generate API Key**.
6. Copy the key immediately and add it to your `.env` file—you won't see it again.

## Callback Origin Configuration

Callback Origins are required for authentication callbacks and social login. Add every self-hosted base URL where Outstatic runs, and make sure each one ends in `/outstatic`.

Examples:

- `https://myblog.com/outstatic`
- `http://localhost:3000/outstatic`
- `https://preview-myblog.vercel.app/outstatic`

Rules:

- Must be a full URL with `http://` or `https://`.
- Must end with `/outstatic`.
- Do not include query params or hash fragments.
- You can add multiple origins (development, preview, production).

If you don't set callback origins, team members can still access and manage content through outstatic.com.

## GitHub Relay for Self-Hosted Installs

If you use `OUTSTATIC_API_KEY`, Outstatic can relay GitHub OAuth through outstatic.com and then send users back to your self-hosted callback route.

This means you can support GitHub login without creating your own local OAuth app credentials.

To use this flow safely:

1. Configure callback origins in outstatic.com (each one ending in `/outstatic`).
2. Make sure your self-hosted callback routes are available at:
   `https://your-domain.com/outstatic/api/outstatic/callback`
   `https://your-domain.com/outstatic/api/outstatic/magic-link-callback`
3. Add `OUTSTATIC_API_KEY` to your `.env`.

Outstatic validates callback URL and callback target strictly. If the callback does not match a configured callback base URL ending in `/outstatic`, or does not resolve to `/outstatic/api/outstatic/callback`, relay login will be blocked.
