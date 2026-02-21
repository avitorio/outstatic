---
title: "Local Development"
status: "published"
author:
  name: "leplay"
  picture: "https://avatars.githubusercontent.com/u/284475?v=4"
slug: "local-development"
description: ""
coverImage: ""
publishedAt: "2026-02-20T03:00:00.000Z"
---

If you have successfully deployed Outstatic to Vercel and want to run Outstatic locally, here are the steps you need to follow:

## Clone the repository and install dependencies

`git clone` your repository and install dependencies:

```bash
pnpm install
# or
yarn install
# or
npm install
```

### Using your OUTSTATIC_API_KEY

If you have created a project on Outstatic.com, you can just add your local install url (example: `http://localhost:3000/outstatic`) to the **API Keys** page for your project.

### Using GitHub OAuth

Since a Github OAuth app cannot have multiple callback URLs, you need to create another [Github OAuth app](https://github.com/settings/developers) for local development.

The only difference is that you need to set the homepage URL to `http://localhost:3000` and set the callback URL to `http://localhost:3000/api/outstatic/callback`.

## Create a `.env.local` file

You can duplicate the `.env.local.example` file and rename it to `.env.local`. Then, fill in the environment variables with the values from your new Github OAuth app.

Note that you should comment out the `OST_MONOREPO_PATH` environment variable if you are not using a monorepo.

## Run the development server

```bash
npm run dev
```