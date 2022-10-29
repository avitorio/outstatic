---
title: 'Getting started'
status: 'published'
author:
  name: 'Andre Vitorio'
  picture: 'https://avatars.githubusercontent.com/u/1417109?v=4'
slug: 'getting-started'
description: ''
coverImage: ''
publishedAt: '2022-10-13T18:34:15.000Z'
---

Here's how you can get started with Outstatic.

Requirements:

- A [Vercel](https://vercel.com) account
- A [GitHub](https://github.com) account

Outstatic uses GitHub OAuth for authentication. Before you start, you'll need to create a GitHub OAuth app.

1. Go to [Register a new OAuth application](https://github.com/settings/applications/new) on GitHub.
1. Give your application a name ("Outstatic Blog", for example).
1. In the **Homepage URL** and **Authorization callback URL** fields, type in any valid URL (for example, `https://outstatic.com`). We'll change these later.
1. You can leave the **Application** description field empty.
1. Click on **Register application**. You'll be redirected to your GitHub OAuth App settings page.
1. Click on **Generate a new client secret**. Keep this tab open; we'll need these values later.

Awesome! With your GitHub OAuth keys in hand, select how you want to use Outstatic:

- [Deploy with Vercel](#deploy-with-vercel)
- [Adding Outstatic to a Next.js website](#adding-outstatic-to-a-nextjs-website)
  - [Access the Outstatic dashboard from your live site](#access-the-outstatic-dashboard-from-your-live-site)

## Deploy with Vercel

To deploy with Vercel, start by clicking the button below and follow the setup steps:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Favitorio%2Foutstatic%2Ftree%2Fmain%2Fexamples%2Fblog&env=OST_GITHUB_ID,OST_GITHUB_SECRET,OST_TOKEN_SECRET&project-name=outstatic-blog&repo-name=outstatic-blog&demo-title=Outstatic%20Blog%20Demo&demo-description=A%20statically%20generated%20blog%20example%20using%20Outstatic&demo-url=https%3A%2F%2Foutstatic-example-blog.vercel.app%2F&demo-image=https%3A%2F%2Foutstatic.com%2Fimages%2Foutstatic-demo.png&envDescription=API%20Keys%20needed%20for%20installation&envLink=https%3A%2F%2Foutstatic.com%2Fdocs%2Fenvironment-variables)

Select GitHub as your git service. Then, type the name of your repository (for example, `outstatic-blog`) and click **Create**.

Fill in the following environment variables:

- `OST_GITHUB_ID` with your GitHub Client ID
- `OST_GITHUB_SECRET` with your GitHub Client secret
- `OST_TOKEN_SECRET` with a random string at least 32 characters in length. You can generate one at [onlinehashtools.com](https://onlinehashtools.com/generate-random-sha256-hash?&count=1).

Click on Deploy, and wait until it's done.

Once the deploy concludes, you will be taken to your Vercel dashboard. There you'll see your new website URL.

Go back to your GitHub OAuth App settings page and update the **Homepage URL** with your new website URL.

You'll also need to update the **Authorization callback URL** by adding `/api/outstatic/callback` to the end of your new website URL.

Example: `https://myblog.vercel.app/api/outstatic/callback`

Click on **Update application** and you are done. You can now visit your site!

To login to your Dashboard, add `/outstatic` to the end of your site url:

Example: `https://myblog.vercel.app/outstatic`

We recommend you [learn how Outstatic manages content](/docs/introduction) and also how to [fetch data from your frontend](/docs/fetching-data).

## Adding Outstatic to a Next.js website

Before we start, you should know Outstatic saves content as markdown files to your GitHub repository. To understand how this works please read our [introduction](https://outstatic.com/docs/introduction) article.

First install the Outstatic package:

```bash
# npm
npm install outstatic

# yarn
yarn add outstatic

#pnpm
pnpm install outstatic
```

Once installed, you'll need to add two files to your `/pages` folder:

`/pages/outstatic/[[...ost]].tsx`

```javascript
import 'outstatic/outstatic.css'
import { Outstatic, OstSSP } from 'outstatic'

export default Outstatic

export const getServerSideProps = OstSSP
```

And `/pages/api/outstatic/[[...ost]].tsx`

```javascript
import { OutstaticApi } from 'outstatic'

export default OutstaticApi
```

Start your dev server. Assuming you're on `http://localhost:3000` you can access your dashboard at `https://localhost:3000/outstatic`.

You should see this page:

![Outstatic welcome screen](/images/outstatic-welcome-U1ND.png)

Let's update your environment variables.

```bash
OST_GITHUB_ID=YOUR_GITHUB_OAUTH_APP_ID
OST_GITHUB_SECRET=YOUR_GITHUB_OAUTH_APP_SECRET
OST_TOKEN_SECRET=A_RANDOM_TOKEN # random string min 32 chars
OST_REPO_SLUG=YOUR_GITHUB_REPOSITORY_SLUG
```

Now go back to your GitHub OAuth App settings page and update the following values:

- **Homepage URL**: `http://localhost:3000/`
- **Authorization callback URL:** `http://localhost:3000/api/outstatic/callback`

Click on **Update application**.

Restart your service and go back to the `/outstatic` page.

If everything is set up correctly, you'll see a login page and will be able to access your Dashboard.

Congratulations! Your Outstatic installation is ready and you can start creating content.

We recommend you [learn how Outstatic manages content](/docs/introduction) and also how to [fetch data from your frontend](/docs/fetching-data).

### Access the Outstatic dashboard from your live site

If you also want to access your Outstatic dashboard from your live site you'll need to create a second GitHub OAuth app, as GitHub doesn't allow for multiple callback URLs for a single OAuth app.

Just repeat the steps for creating a GitHub OAuth app, but this time, replacing `http://localhost:3000/` on **Homepage URL** and **Authorization callback URL** with your actual website address.

Don't forget to add the [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables) on your Vercel project:

```bash
OST_GITHUB_ID=YOUR_GITHUB_OAUTH_APP_ID
OST_GITHUB_SECRET=YOUR_GITHUB_OAUTH_APP_SECRET
OST_TOKEN_SECRET=A_RANDOM_TOKEN # random string min 32 chars
```
