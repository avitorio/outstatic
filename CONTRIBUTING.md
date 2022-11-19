# Contributing to Outstatic

- Before jumping into a PR be sure to search [existing PRs](https://github.com/avitorio/outstatic/pulls) or [issues](https://github.com/avitorio/outstatic/issues) for an open or closed item that relates to your submission.
- If you can't get something to work the way you expect, [open a question](https://github.com/avitorio/outstatic/discussions/new?category=q-a) in our discussion forums.
- If you are interested in adding a feature or improving the code, please [start a discussion](https://github.com/avitorio/outstatic/discussions/new?category=ideas) about it first.
- Here's a summary of the monorepo structure:

  ```
  . #root of the repository
  ├──── apps
  │     └──── dev # development blog using the monorepo's version of `outstatic`
  │     └──── web # Outstatic's website: https://outstatic.com
  ├──── examples
  │     └──── blog # example blog using the latest `outstatic` release
  └──── packages
        └──── outstatic # the actual library code

  ```

  Note: changes to `/apps/dev` should be copied over to `/examples/blog`.

# Developing

- The development branch is `canary`.
- All pull requests should be opened against `canary`.
- Note: Offline development is very limited. Outstatic relies heavily on making calls to the GitHub API.

To develop locally:

1. Install the [GitHub CLI](https://github.com/cli/cli#installation).
1. Create a fork of the Outstatic repository:

   ```
   gh repo fork avitorio/outstatic
   ```

   When prompted: 'Would you like to clone the fork?' answer `Y` and press `Enter`.

1. Enable pnpm:
   ```
   corepack enable pnpm
   ```
1. Install the dependencies with:
   ```
   pnpm install
   ```

## Setting up Outstatic

There are a few particularities to how Outstatic works. Since most editor actions (creating collections, editing documents, etc...) result in commits, you should avoid editor originated commits being added to your development branches. Ideally, when developing, point your `OST_REPO_BRANCH` to a different branch than the one you are working on.

1. We recommend developing the library together with the `outstatic-dev-blog` located at `/apps/dev`. For that you should create a `.env.local` file in that folder and add the following environment variables:
   ```
    OST_GITHUB_ID=YOUR_GITHUB_OAUTH_ID
    OST_GITHUB_SECRET=YOUR_GITHUB_OAUTH_SECRET
    OST_TOKEN_SECRET=A_32CHAR_RANDOM_STRING_FOR_YOUR_TOKEN_SECRET
    OST_REPO_SLUG=outstatic
    OST_REPO_BRANCH=main
    OST_CONTENT_PATH=outstatic/content
    OST_MONOREPO_PATH=apps/dev
   ```

## Continue developing

1. Create a new branch:
   ```
   git checkout -b MY_BRANCH_NAME origin/canary
   ```
1. Start developing and watch for code changes:
   ```
   pnpm dev --filter outstatic-dev-blog --filter outstatic
   ```
   The above command will tell turborepo to only load the `outstatic` library and the `outstatic-dev-blog` project.
1. When your changes are finished, commit them to the branch:
   ```
   git add .
   git commit -m "DESCRIBE_YOUR_CHANGES_HERE"
   ```
1. To open a pull request you can use the GitHub CLI which automatically forks and sets up a remote branch. Follow the prompts when running:
   ```
   gh pr create
   ```

That's it. We will review your PR and hopefully integrate it in the project. Thank you for your help!

# Other details

## GraphQL Schema

We use `graphql-codegen` to generate queries, mutations and other GraphQL related code. Whenever you create new queries or mutations, you should go to the `/packages/outstatic` folder and run:

```
pnpm graphql-codegen
```

## Deploying to Vercel

You can deploy the `outstatic-dev-blog` to Vercel by adding a new project with the following configuration:

1. Set the **Root Directory** to `apps/dev`

1. On the **Build and Output Settings** section add the following to your `Build Command`:

   ```
   cd ../.. && pnpm turbo run build --scope=outstatic-dev-blog --include-dependencies --no-deps
   ```

1. Setup your Environment Variables:
   ```
    OST_GITHUB_ID=YOUR_GITHUB_OAUTH_ID
    OST_GITHUB_SECRET=YOUR_GITHUB_OAUTH_SECRET
    OST_TOKEN_SECRET=A_32CHAR_RANDOM_STRING_FOR_YOUR_TOKEN_SECRET
    OST_REPO_SLUG=outstatic
    OST_REPO_BRANCH=main
    OST_CONTENT_PATH=outstatic/content
    OST_MONOREPO_PATH=apps/dev
   ```
   Keep in mind that, if you want to log in to your **Outstatic Dashboard** on Vercel, you should probably create a different GitHub OAuth App from the one you use for local development, since the callback url is going to be different.
