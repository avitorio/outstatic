---
title: 'FAQs'
status: 'published'
author:
  name: 'Andre Vitorio'
  picture: 'https://avatars.githubusercontent.com/u/1417109?v=4'
slug: 'faqs'
description: ''
coverImage: ''
publishedAt: '2023-08-06T12:07:51.000Z'
---

## I already have a Next.js Markdown blog, how do I start using Outstatic?

Follow the [**Add to Next.js**](/docs/getting-started#adding-outstatic-to-a-nextjs-website)\*\* \*\*documentation. Once finished, log in to your Outstatic dashboard, create collections that match your content and then copy the .md files into the collection directories inside `/outstatic/content`, for example: `/outstatic/content/blog/my-blog-post.md`.

Don't forget to recreate the Metadata Database with your new posts by going to Settings > Rebuild Metadata:

![](/images/rebuild-metadata-Y4MT.png)<br>

This will create a `metadata.json` file inside of `outstatic/content` in your GitHub repository. You should pull the changes to your local install to be able to use the Metadata DB.

## Where is the data stored?

All your Outstatic documents and collections are saved as Markdown files in your GitHub repository. In other words, all saved content creates a commit. The commit message specifies the collection and document that is created, for example, if your document is in the recipes collection the commit message would be: `feat(recipes): apple-pie-recipe`o

For convenience we also store metadata in a `metadata.json` file to be used with our [Advanced Data Fetching](/docs/fetching-data#advanced-document-fetching---metadata-db) methods.

## Can I host my Outstatic website on a provider other than Vercel?

Yes. We have seen examples of websites being launched on Netlify and other providers.

We specified Vercel on the documentation as it is the only platform we've tried Outstatic on. I don't see why it wouldn't work on other or your own preferred setup.

If you try a different hosting/deploy approach, please [let us know](https://twitter.com/outstatic)!

