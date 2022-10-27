---
title: 'Environment variables'
status: 'published'
author:
  name: 'Andre Vitorio'
  picture: 'https://avatars.githubusercontent.com/u/1417109?v=4'
slug: 'environment-variables'
description: ''
coverImage: ''
publishedAt: '2022-10-13T12:36:25.000Z'
---

Here's a list of all the environment variables needed to run your Outstatic install:

```bash
# REQUIRED Environment variables
OST_GITHUB_ID=YOUR_GITHUB_OAUTH_ID
OST_GITHUB_SECRET=YOUR_GITHUB_OAUTH_SECRET
OST_TOKEN_SECRET=A_32CHAR_RANDOM_STRING_FOR_YOUR_TOKEN_SECRET
OST_REPO_SLUG=THE_REPOSITORY_SLUG # If empty AND on Vercel, this will default to VERCEL_GIT_REPO_SLUG

# OPTIONAL Environment variables
OST_REPO_BRANCH=THE_REPOSITORY_BRANCH # If empty, this will default to main
OST_REPO_OWNER=THE_REPO_OWNER # If empty, GitHub username is used
OST_CONTENT_PATH=outstatic/content # Where content is saved, if empty it defaults to outstatic/content
OST_MONOREPO_PATH=apps/web # Specify monorepo folder of your Outstatic content
```

**Good to know**: To get your repository slug we first try fetching the `OST_REPO_SLUG` environment variable. If that is empty, we try `VERCEL_GIT_REPO_SLUG`, which is one of Vercel's default environment variables. If both are empty, you'll get a warning saying you need to add `OST_REPO_SLUG` to your environment variables.

In case you need help on how to get your GitHub OAuth credentials, please read the [Getting started](/docs/getting-started) section.
