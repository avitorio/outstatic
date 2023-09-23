---
title: 'GitHub Apps Authentication'
status: 'draft'
author:
  name: 'Anthony Quéré'
  picture: 'https://avatars.githubusercontent.com/u/47711333?v=4'
slug: 'github-apps-authentication'
description: ''
coverImage: ''
publishedAt: '2023-08-04T21:00:00.000Z'
---

## Use Github Apps for Authentication

GitHub Documentation recommands the usage of GitHub Applications instead of OAuth Applications as stated in [this article](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps).

Outstatic can work with GitHub Applications as well as Oauth applications out of the box. Let's create a GitHub Application:

- First go to the "Register a new OAuth application" page on GitHub by [clicking here](https://github.com/settings/apps/new).

- Give your application a name, "Outstatic Blog" for example.

- For **Homepage URL**, give any valid URL. You can change it later to your website URL.

- For **Callback URL**, set it to `https://my-website-name.com/api/outstatic/callback` (for local developpment, localhost with a port also works).

- You do not need to check anythink in the next section.

- For **Permissions**, Outstatic only needs read and wite access to a specific repository. You can open "Repository permissions" and next to "Contents", select "Read and write"

- In the last section. If you want to create the repository on your own account check "Only on this account" otherwise chose "Any account"

- Click on **Create GitHub App**, you will be redirected to your application settings.

- Copy your **Client ID** from your application settings

- Generate a **Client Secret** by clicking on **Generate a new client secret**

- In your application settings, click on "Install App" and click "Install" for the account/organization where you want to add the repository.

- You can select to give permission to all repositories inside the account/organization but it is best to choose "Only select repositories" and add your repository there. (You can still change your app permission in the account/organization settings).

Then you only need to follow the [Getting Started Guide](/docs/getting-started) to configure your application with these values.

