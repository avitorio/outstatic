---
title: "Getting started"
status: "published"
author:
  name: "Andre Vitorio"
  picture: "https://avatars.githubusercontent.com/u/1417109?v=4"
slug: "getting-started"
description: "Get started with Outstatic"
coverImage: ""
publishedAt: "2024-10-30T03:00:00.000Z"
---

Here's how you can get started with Outstatic.

Requirements:

- A [Vercel](https://vercel.com) account.

- A [GitHub](https://github.com) account.

### **Initiating Setup: GitHub Authentication**

Before diving in, it's essential to configure GitHub Authentication for your project. Outstatic accommodates both **GitHub OAuth** and **GitHub Apps** for authentication purposes:

- **GitHub OAuth:** easier and quicker to set up, ideal for simpler integrations.

- **GitHub Apps:** setup is generally more complex, providing a refined level of access and control.

For those opting for GitHub Apps, please refer to the relevant [GitHub Apps Authentication](/github-apps-authentication) documentation.

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

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/avitorio/outstatic/tree/main/examples/basic-blog&env=OST_GITHUB_ID,OST_GITHUB_SECRET&project-name=outstatic-blog&repo-name=outstatic-basic-blog&demo-title=Outstatic%20Basic%20Blog%20Demo&demo-description=A%20statically%20generated%20blog%20example%20using%20Outstatic&demo-url=https://outstatic-dev-blog.vercel.app/&demo-image=https://outstatic.com/images/outstatic-demo.png&envDescription=API%20Keys%20needed%20for%20installation&envLink=https://outstatic.com/docs/environment-variables)

Select GitHub as your git service. Then, type the name of your repository (ex: `outstatic-blog`) and click **create**.

Fill in the following environment variables:

- `OST_GITHUB_ID` with your GitHub Client ID.

- `OST_GITHUB_SECRET` with your GitHub Client secret.

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

To develop your Vercel deployed website locally, please check the [Local Development](/local-development) page.

We recommend you learn how [Outstatic manages content](/introduction) and also how to [fetch content](/fetching-data) from your front end.

## Adding Outstatic to a Next.js website

If you want to use Outstatic with Next.js 12, you can [continue here](/using-with-next-js-12).

Before we start, you should know Outstatic saves content as markdown files to your GitHub repository. To understand how this works please read our [introduction](https://outstatic.com/introduction) article.

First install the Outstatic package and dependencies:

```bash
npm install outstatic
```

```bash
yarn add outstatic
```

```bash
pnpm install outstatic
```

```bash
bun add outstatic
```

Once installed, you'll need to add three files to your `/app` folder. We'll create a [route group](https://nextjs.org/docs/app/building-your-application/routing/route-groups) so that your site's styles won't interfere with the Outstatic dashboard. Here we've named the route group `(cms)`:

`/app/(cms)/layout.tsx`

```javascript
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

`/app/(cms)/outstatic/[[...ost]]/page.tsx`

```javascript
import 'outstatic/outstatic.css'
import { Outstatic } from 'outstatic'
import { OstClient } from 'outstatic/client'

export default async function Page({ params }: { params: { ost: string[] } }) {
  const ostData = await Outstatic()
  return <OstClient ostData={ostData} params={params} />
}
```

And lastly, the api route (outside of the route group): `/app/api/outstatic/[[...ost]]/route.ts`

```javascript
import { OutstaticApi } from 'outstatic'

export const GET = OutstaticApi.GET

export const POST = OutstaticApi.POST
```

Start your dev server. Assuming you're on `http://localhost:3000` you can access your dashboard at `https://localhost:3000/outstatic`.

You should see this page:

![Outstatic welcome screen](/docs/images/outstatic-welcome-U1ND.png)Let's update your environment variables.

```bash
OST_GITHUB_ID=YOUR_GITHUB_OAUTH_APP_ID
OST_GITHUB_SECRET=YOUR_GITHUB_OAUTH_APP_SECRET

# REQUIRED
# The name of your repository on GitHub without the username
# Example, for avitorio/outstatic, OST_REPO_SLUG=outstatic
OST_REPO_SLUG=YOUR_GITHUB_REPOSITORY_SLUG

# OPTIONAL
# Useful if the project is not under your GitHub account
# Example, for avitorio/outstatic, OST_REPO_OWNER=avitorio
OST_REPO_OWNER=YOUR_GITHUB_USERNAME

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

![](/docs/images/outstatic-login-screen-I4Mz.png)

Congratulations! Your Outstatic installation is ready and you can now start creating content.

If you already have a Markdown Next.js blog and want to start editing your files with Outstatic, follow the [steps here](/faqs#i-already-have-a-nextjs-markdown-blog-how-do-i-start-using-outstatic) to move your content to the `outstatic/content` folder.

**Next.js 13 Warning:** In case your Outstatic Dashboard throws errors while trying to create new pages. Either update Next.js to a version above `13.4.8` or add the option `swcMinify: false` to your `next.config.js` file. Example:

```javascript
const nextConfig = {
  swcMinify: false
}
```

We recommend you learn how Outstatic [manages content](/introduction) and also how to [fetch data](/fetching-data) from your front end.

### Access the Outstatic dashboard from your live site

If you also want to access your Outstatic dashboard from your live site you'll need to create a second GitHub OAuth app as GitHub doesn't allow for multiple callback urls for a single OAuth app.

Just repeat the steps for creating a GitHub OAuth app, but this time, replacing `http://localhost:3000/` on **Homepage URL** and **Authorization callback URL** with your actual website address.

Don't forget to add the following environment variables to your Vercel project:

```bash
OST_GITHUB_ID=YOUR_GITHUB_OAUTH_APP_ID
OST_GITHUB_SECRET=YOUR_GITHUB_OAUTH_APP_SECRET
```

To learn more about all the available environment variables, see the [Environment Variables ](https://outstatic.com/environment-variables)section of the docs.