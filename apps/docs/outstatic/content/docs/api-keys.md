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
OST_PRO_API_KEY=your_api_key_here
```

Once configured, your self-hosted Outstatic instance can access PRO features. The key is validated on each request to ensure only authorized projects can use these capabilities.

**Important:** Save your API key securely when it's first generated. You won't be able to see the full key again—only a prefix for identification. If you lose it, you'll need to regenerate a new key (which will revoke the old one).

## PRO Features Unlocked

With a valid API key, your self-hosted Outstatic instance gains access to:

- **AI Completions** — AI-powered writing suggestions in the content editor (requires `OPENAI_API_KEY` as well)
- **Email and social login** — Invite team members who can sign in with email or social providers (GitHub, Google, etc.)
- **Advanced authentication** — Configure your Project URL so members are redirected to your custom domain after signing in
- **Project members management** — Manage your project's members and their roles

## Getting an API Key

1. Sign in to [outstatic.com](outstatic.com) and open your project
2. Go to the **API Key** tab in your project settings
3. Configure your **Project URL** (the public URL where your Outstatic instance is hosted)
4. Click **Generate API Key**
5. Copy the key immediately and add it to your `.env` file—you won't see it again

## Project URL Configuration

Your Project URL is required for authentication callbacks and social login. It tells Outstatic where to redirect users after they sign in. For example, if your Outstatic install lives at `https://myblog.com/outstatic`, that's your Project URL.

If you don't set a Project URL, team members can still access and manage content through outstatic.com.
