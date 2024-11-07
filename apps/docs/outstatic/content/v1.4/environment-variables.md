---
title: "Environment Variables"
status: "published"
author:
  name: "Andre Vitorio"
  picture: "https://avatars.githubusercontent.com/u/1417109?v=4"
slug: "environment-variables"
description: ""
coverImage: ""
publishedAt: "2024-10-30T03:00:00.000Z"
---

Here's a list of all the environment variables needed to run your Outstatic install:

```bash
# REQUIRED Environment variables
OST_GITHUB_ID=YOUR_GITHUB_OAUTH_OR_APPS_ID
OST_GITHUB_SECRET=YOUR_GITHUB_OAUTH_OR_APPS_SECRET

# OST_REPO_SLUG (Ex: for avitorio/outstatic, OST_REPO_SLUG=outstatic)
OST_REPO_SLUG=THE_REPOSITORY_SLUG
# If empty AND on Vercel, this will default to VERCEL_GIT_REPO_SLUG

# OPTIONAL Environment variables

# Main branch of the project. If empty, this will default to 'main'
OST_REPO_BRANCH=main

# Repository owner or organization. If empty, logged in GitHub username is used.
OST_REPO_OWNER=myusername

# Where content is saved. Defaults to outstatic/content if empty.
OST_CONTENT_PATH=outstatic/content

# If your Next.js project is inside a monorepo, ie: your /outstatic folder 
# is not at the root level of your repository. Specify monorepo folder of 
# your Next.js install
OST_MONOREPO_PATH=apps/web

# OpenAI API Key for AI Completions
OPENAI_API_KEY=sk-XXXXXXX

# Use with Next.js basePath
# https://nextjs.org/docs/app/api-reference/next-config-js/basePath
OST_BASE_PATH=/docs

# This is not needed but can make your install slightly more secure
OST_TOKEN_SECRET=A_32CHAR_RANDOM_STRING_FOR_YOUR_TOKEN_SECRET
```

**Good to know**: To get your repository slug we first try fetching the `OST_REPO_SLUG` environment variable. If that is empty, we try `VERCEL_GIT_REPO_SLUG`, which is one of Vercel's default environment variables. If both are empty, you'll get a warning saying you need to add `OST_REPO_SLUG` to your environment variables.\
\
**Important:** Don't forget to redeploy your website or restart your server after updating environment variables.

In case you need help on how to get your GitHub OAuth credentials, please read the [Getting started](/getting-started) section.