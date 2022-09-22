---
title: 'Getting started'
status: 'published'
author:
  name: 'Andre Vitorio'
  picture: 'https://avatars.githubusercontent.com/u/1417109?v=4'
slug: 'getting-started'
description: ''
coverImage: ''
publishedAt: '2022-09-18T18:34:15.631Z'
---

Here's how you can get started with Outstatic.

Requirements:

- A [Vercel](https://vercel.com) account connected to your [Github](https://github.com) account.

You can deploy a starter website on Vercel or add Outstatic manually to your current Next.js website.

## Deploying with vercel:

Before we start we'll need to create a Github OAuth app:

- First go to the "Register a new OAuth application" page on Github by [clicking here](https://github.com/settings/applications/new). It may be useful to open it in a new tab so you can refer back to this page.

- Give your application a name, "Outstatic Blog" for example.

- For the **Homepage URL, Authorization callback URL** field type in any valid url, ex: [https://outstatic.com](https://outstatic.com), we'll change it later.

- You can leave the **Application** description field empty.

Click on Register application. You'll be redirected to a page with your Github Oauth App settings page. There you'll find your application's Client ID and Client secret. Keep this tab open, you'll need these values for our next step.

To deploy with Vercel, start by clicking the button below and follow the setup steps:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Favitorio%2Foutstatic-beta%2Ftree%2Fmain%2Fexamples%2Fblog&env=OST_GITHUB_ID,OST_GITHUB_SECRET,OST_TOKEN_SECRET&project-name=outstatic-blog&repo-name=outstatic-blog&demo-title=Outstatic%20Blog%20Demo&demo-description=A%20statically%20generated%20blog%20example%20using%20Outstatic&demo-url=https%3A%2F%2Foutstatic-blog-example.vercel.app%2F&demo-image=https%3A%2F%2Foutstatic-blog-example.vercel.app%2Fassets%2Foutstatic-demo.png)

First pick a name for your repository (ex: outstatic-blog) and click **create**.

Then fill in the following environment variables:

- **OST_GITHUB_ID** with your Github Client ID.

- **OST_GITHUB_SECRET** with your Github Client secret.

- **OST_TOKEN_SECRET** with a random string with at least 32 characters. You can generate a random string using [this service](https://onlinehashtools.com/generate-random-sha256-hash?&count=1).

Deploy will start. Once concluded you will be taken to your Vercel dashboard. There you'll see your new website URL.

Go back to your Github OAuth App settings page and update the **Homepage URL** with your new website URL.

You'll also need to update the **Authorization callback URL** with your new website URL, but you'll need to add `/api/outstatic/callback` to the end of the url. Example: [https://outstatic-blog.vercel.app/api/outstatic/callback](https://outstatic-blog.vercel.app/api/outstatic/callback)

Click on **Update application** and you are done!

You can now visit your site and start using Outstatic!
