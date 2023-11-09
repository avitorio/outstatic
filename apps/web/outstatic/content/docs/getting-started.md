---
title: 'Getting started'
status: 'published'
author:
  name: 'Andre Vitorio'
  picture: 'https://avatars.githubusercontent.com/u/1417109?v=4'
slug: 'getting-started'
description: 'Get started with Outstatic'
coverImage: ''
publishedAt: '2023-09-23T18:34:15.000Z'
---

Here's how you can get started with Outstatic.

Requirements:

- A [Vercel](https://vercel.com) account.

- A [GitHub](https://github.com) account.

### **Initiating Setup: GitHub Authentication**

Before diving in, it's essential to configure GitHub Authentication for your project. Outstatic accommodates both **GitHub OAuth** and **GitHub Apps** for authentication purposes:

- **GitHub OAuth:** easier and quicker to set up, ideal for simpler integrations.

- **GitHub Apps:** setup is generally more complex, providing a refined level of access and control.

For those opting for GitHub Apps, please refer to the relevant [GitHub Apps Authentication](/docs/github-apps-authentication) documentation.

#### Setting up a GitHub OAuth Application:

Let’s walk through the steps to create a GitHub OAuth Application, streamlining your project’s initial setup:

- First go to the "Register a new OAuth application" page on GitHub by [clicking here](https://github.com/settings/applications/new).

- Give your application a name, "Outstatic Blog" for example.

- For the **Homepage URL** and **Authorization callback URL** fields type in any valid url, ex: `https://outstatic.com`, we'll change them later.

- You can leave the **Application** description field empty.

Click on **Register application**. You'll be redirected to your GitHub Oauth App settings page.

Next, click on **Generate a new client secret**. Once done, keep this tab open. We'll need these values for our next steps.

Awesome, with your GitHub Oauth keys in hand select how you want to use Outstatic:

- [Deploy a starter website on Vercel](#deploy-with-vercel).

- [Add Outstatic manually to your current Next.js website](#adding-outstatic-to-a-nextjs-website).

## Deploy with vercel:

To deploy with Vercel, start by clicking the button below and follow the setup steps:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Favitorio%2Foutstatic%2Ftree%2Fmain%2Fexamples%2Fblog&env=OST_GITHUB_ID,OST_GITHUB_SECRET,OST_TOKEN_SECRET&project-name=outstatic-blog&repo-name=outstatic-blog&demo-title=Outstatic%20Blog%20Demo&demo-description=A%20statically%20generated%20blog%20example%20using%20Outstatic&demo-url=https%3A%2F%2Foutstatic-dev-blog.vercel.app%2F&demo-image=https%3A%2F%2Foutstatic.com%2Fimages%2Foutstatic-demo.png&envDescription=API%20Keys%20needed%20for%20installation&envLink=https%3A%2F%2Foutstatic.com%2Fdocs%2Fenvironment-variables)

Select GitHub as your git service. Then, type the name of your repository (ex: `outstatic-blog`) and click **create**.

Fill in the following environment variables:

- `OST_GITHUB_ID` with your GitHub Client ID.

- `OST_GITHUB_SECRET` with your GitHub Client secret.

- `OST_TOKEN_SECRET` with a random string with at least 32 characters. You can generate a random string using [this service](https://onlinehashtools.com/generate-random-sha256-hash?&count=1).

Click on Deploy and wait until it's done.

Once the deploy is concluded, you will be taken to your Vercel dashboard. There you'll see your new website URL.

Go back to your GitHub OAuth App settings page and update the **Homepage URL** with your new website URL.

You'll also need to update the **Authorization callback URL** with your new website URL, but you'll need to add `/api/outstatic/callback` to the end of the url.

Example: `https://myblog.vercel.app/api/outstatic/callback`

Click on **Update application** and you are done!

You can now visit your site.

To login to your Dashboard add `/outstatic` to the end of your site url:

Example: `https://myblog.vercel.app/outstatic`

Congratulations! Now you have a website with a full-featured dashboard to edit your content.

To develop your Vercel deployed website locally, please check the [Local Development](/docs/local-development) page.

We recommend you learn how [Outstatic manages content](/docs/introduction) and also how to [fetch content](/docs/fetching-data) from your front end.

## Adding Outstatic to a Next.js website

If you want to use Outstatic with Next.js 12, you can [continue here](/docs/using-with-next-js-12).

Before we start, you should know Outstatic saves content as markdown files to your GitHub repository. To understand how this works please read our [introduction](https://outstatic.com/docs/introduction) article.

First install the Outstatic package and dependencies:

```bash
# npm
npm install outstatic

# yarn
yarn add outstatic

#pnpm
pnpm install outstatic
```

Once installed, you'll need to add two files to your `/app` folder:

`/app/outstatic/[[...ost]]/page.tsx`

```javascript
import 'outstatic/outstatic.css'
import { Outstatic } from 'outstatic'
import { OstClient } from 'outstatic/client'

export default async function Page({ params }: { params: { ost: string[] } }) {
  const ostData = await Outstatic()
  return <OstClient ostData={ostData} params={params} />
}
```

And `/app/api/outstatic/[[...ost]]/route.ts`

```javascript
import { OutstaticApi } from 'outstatic'

export const GET = OutstaticApi.GET

export const POST = OutstaticApi.POST
```

Start your dev server. Assuming you're on `http://localhost:3000` you can access your dashboard at `https://localhost:3000/outstatic`.

You should see this page:

![Outstatic welcome screen](/images/outstatic-welcome-U1ND.png)Let's update your environment variables.

```bash
OST_GITHUB_ID=YOUR_GITHUB_OAUTH_APP_ID
OST_GITHUB_SECRET=YOUR_GITHUB_OAUTH_APP_SECRET
# random string min 32 chars
OST_TOKEN_SECRET=A_RANDOM_TOKEN
OST_REPO_SLUG=YOUR_GITHUB_REPOSITORY_SLUG

# OPTIONAL
# If empty this will default to main
OST_REPO_BRANCH=YOUR_GITHUB_REPOSITORY_BRANCH
```

Now go back to your GitHub OAuth App settings page and update the following values:

- **Homepage URL**: `http://localhost:3000/`.

- **Authorization callback URL:** `http://localhost:3000/api/outstatic/callback`

Click on **Update application**.

Restart your service and go back to the `/outstatic` page.

If everything is setup correctly, then you'll see a login page and will be able to access your Dashboard.

![](/images/outstatic-login-screen-I4Mz.png)

Congratulations! Your Outstatic installation is ready and you can now start creating content.

If you already have a Markdown Next.js blog and want to start editing your files with Outstatic, follow the [steps here](/docs/faqs#i-already-have-a-nextjs-markdown-blog-how-do-i-start-using-outstatic) to move your content to the `outstatic/content` folder.

**Next.js 13 Warning:** In case your Outstatic Dashboard throws errors while trying to create new pages. Either update Next.js to a version above `13.4.8` or add the option `swcMinify: false` to your `next.config.js` file. Example:

```javascript
const nextConfig = {
  swcMinify: false
}
```

We recommend you learn how Outstatic [manages content](/docs/introduction) and also how to [fetch data](/docs/fetching-data) from your front end.

### Access the Outstatic dashboard from your live site

If you also want to access your Outstatic dashboard from your live site you'll need to create a second GitHub OAuth app as GitHub doesn't allow for multiple callback urls for a single OAuth app.

Just repeat the steps for creating a GitHub OAuth app, but this time, replacing `http://localhost:3000/` on **Homepage URL** and **Authorization callback URL** with your actual website address.

Don't forget to add the following environment variables to your Vercel project:

```bash
OST_GITHUB_ID=YOUR_GITHUB_OAUTH_APP_ID
OST_GITHUB_SECRET=YOUR_GITHUB_OAUTH_APP_SECRET
# random string min 32 chars
OST_TOKEN_SECRET=A_RANDOM_TOKEN
```

To learn more about all the available environment variables, see the [Environment Variables ](https://outstatic.com/docs/environment-variables)section of the docs.
