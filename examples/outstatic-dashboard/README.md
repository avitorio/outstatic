# Outstatic Dashboard

A standalone Outstatic dashboard for managing Markdown and MDX content in GitHub.

Use this repository when you want a visual CMS for a static website, without tying your content workflow to a specific framework. Outstatic can manage Markdown content for any GitHub repository, so it works with static sites built with Next.js, Astro, Gatsby, Eleventy, Hugo, Jekyll, Docusaurus, custom static generators, or your own build pipeline.

Your content stays in GitHub. Outstatic gives you the editing experience.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/outstatic/outstatic-dashboard&env=OUTSTATIC_API_KEY&project-name=outstatic-dashboard&repo-name=outstatic-dashboard&demo-title=Outstatic%20Dashboard&demo-description=Standalone%20CMS%20dashboard%20for%20Markdown%20and%20MDX%20content&demo-url=https://outstatic.com&demo-image=https://outstatic.com/images/outstatic-demo.png&envDescription=Outstatic%20API%20key%20needed%20for%20dashboard%20access&envLink=https://outstatic.com/docs/environment-variables)

## Why use this?

Most static websites already have a great build system. What they usually do not have is a simple editorial interface.

Outstatic Dashboard gives you a CMS that sits on top of your GitHub repository. Writers and editors can create, edit, and publish content through a clean dashboard, while developers keep the benefits of Markdown, MDX, Git, pull requests, and static builds.

You can use it with:

- Next.js
- Astro
- Gatsby
- Eleventy
- Hugo
- Jekyll
- Docusaurus
- Vite-powered static sites
- Any framework or build process that reads Markdown or MDX from a GitHub repository

Outstatic does not require your website to be built with Next.js. This repository only provides the dashboard app. Your actual website can use any static website framework.

## What this repository provides

This is a ready-to-run Outstatic dashboard app.

It lets you:

- Edit Markdown and MDX content from a browser
- Store content directly in GitHub
- Manage content for another repository
- Use GitHub as your source of truth
- Keep your CMS separate from your frontend website
- Work with existing static sites
- Support monorepos and custom content folders
- Deploy the dashboard independently from your website

## How it works

Outstatic connects to a GitHub repository and saves content as Markdown or MDX files.

Your static website then reads those files during development or build time, just like it would read any other local content source.

The workflow looks like this:

1. Deploy or run this dashboard.
2. Connect it to a GitHub repository.
3. Create and edit content in Outstatic.
4. Outstatic commits content changes to GitHub.
5. Your static site builds from the updated Markdown or MDX files.

This makes Outstatic a good fit for static websites where content should stay portable, versioned, and framework-independent.

## Getting started

### 1. Clone the dashboard

```bash
git clone git@github.com:outstatic/outstatic-dashboard.git
cd outstatic-dashboard
pnpm install
pnpm dev
```

If you prefer npm:

```bash
npm install
npm run dev
```

### 2. Open the dashboard

Start the dev server and open:

```text
http://localhost:3000/outstatic
```

You should see the Outstatic dashboard login screen.

### 3. Sign in with GitHub through Outstatic

The recommended setup is to sign in with GitHub through Outstatic.

1. Open `/outstatic`.
2. Click **Sign in with GitHub**.
3. Follow the flow to create a free Outstatic account.
4. Generate an API key for your project.
5. Add the API key to your environment variables:

```bash
OUTSTATIC_API_KEY=ost_******************************
```

Then restart the dev server, go back to `/outstatic`, and sign in again.

If everything is configured correctly, you will land in your dashboard and can start creating content.

## Deploying to production

You can deploy this dashboard to Vercel or any platform that supports Next.js.

After deploying:

1. Open the Outstatic dashboard.
2. Go to **API Keys**.
3. Add your deployed dashboard URL as a callback origin.
4. Add `OUTSTATIC_API_KEY` to your production environment variables.
5. Redeploy the app.

Your deployed dashboard can now manage content for your GitHub repository.

## Environment variables

### Recommended

| Variable            | Required | Description                                                                                                 |
| ------------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `OUTSTATIC_API_KEY` | Yes      | API key generated from Outstatic. Used to authenticate your dashboard with Outstatic-managed GitHub access. |

### Advanced GitHub OAuth setup

You can also configure direct GitHub OAuth access manually.

| Variable            | Required | Description                                                     |
| ------------------- | -------- | --------------------------------------------------------------- |
| `OST_GITHUB_ID`     | Optional | GitHub OAuth app client ID                                      |
| `OST_GITHUB_SECRET` | Optional | GitHub OAuth app client secret                                  |
| `OST_REPO_SLUG`     | Optional | Repository name where content is stored                         |
| `OST_REPO_BRANCH`   | Optional | Branch where content is saved. Defaults to `main`               |
| `OST_REPO_OWNER`    | Optional | GitHub owner or organization. Defaults to the logged-in user    |
| `OST_CONTENT_PATH`  | Optional | Folder where content is stored. Defaults to `outstatic/content` |
| `OST_MONOREPO_PATH` | Optional | Path to the app inside a monorepo, for example `apps/web`       |

## Using Outstatic with any static framework

Outstatic is framework-independent because it writes plain Markdown and MDX files to GitHub.

Your website only needs to know where those files are stored.

For example:

```text
outstatic/content/posts/my-first-post.md
outstatic/content/pages/about.md
outstatic/content/authors/andre.md
```

A Next.js site can read those files during static generation.

An Astro site can load them through content collections or a custom loader.

An Eleventy, Hugo, Jekyll, or Gatsby site can read them using its normal Markdown pipeline.

A custom static generator can parse the files directly.

Outstatic handles editing and publishing. Your framework handles rendering.

## Example use cases

Use this dashboard for:

- Marketing sites
- Blogs
- Documentation sites
- Agency client websites
- SaaS changelogs
- Static landing pages
- Portfolio sites
- Content-driven microsites
- MDX-powered websites
- Multi-site content workflows stored in GitHub

## Why separate the dashboard from the website?

Keeping the dashboard separate gives you more flexibility.

You can:

- Add a CMS to an existing static website without changing its framework
- Manage content for multiple frontend projects
- Keep the editing interface isolated from the public site
- Avoid coupling your CMS to your rendering layer
- Let the frontend remain a simple static build

This is especially useful for agencies, freelancers, and teams that maintain several static websites.

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
```

Or with npm:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Tech stack

- Outstatic
- Next.js
- React
- TypeScript
- Tailwind CSS

## Documentation

- Outstatic website: https://outstatic.com
- Documentation: https://outstatic.com/docs
- Using Outstatic for Markdown content: https://outstatic.com/docs/using-outstatic-for-markdown-content
- Environment variables: https://outstatic.com/docs/environment-variables
- Main Outstatic repository: https://github.com/avitorio/outstatic

## License

MIT
