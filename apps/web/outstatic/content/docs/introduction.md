---
title: 'Introduction'
status: 'published'
author:
  name: 'Andre Vitorio'
  picture: 'https://avatars.githubusercontent.com/u/1417109?v=4'
slug: 'introduction'
description: ''
coverImage: ''
publishedAt: '2022-10-13T17:50:55.000Z'
---

Outstatic is an open source content management system (CMS) for static websites using [Next.js](https://nextjs.org). All you need to get started is a [Github](https://github.com) and [Vercel](https://vercel.com/signup) account.

The concept is simple. Write content, click save and see the changes on your website.

You can get started by visiting our [Getting started](/docs/getting-started) section. If you want to learn a bit more about Outstatic, keep reading.

## How does Outstatic work?

We provide you with a user interface (UI) to create and edit website content. There are no tedious database or server to set up, **all of the data is added to your Github repository via commits**.

To see the changes on your website you'll need to wait until Vercel finishes deploying it. In the case you are developing your site locally, you'll need to pull the changes to see them on your dev environment.

Your site's content is organised into two parts: **collections** and **documents**.

### What are Collections?

Collections are used to organise and define the types of content on your website, think of it as categories of content. For example, in the case of a blog, you'll create a **Posts** collection. This collection will hold all the posts, each post being a post document.

You probably won't be creating collections all the time, they are basically what form the structure of your website. When you log in to your Outstatic dashboard for the first time you'll be asked to create a **collection**.

Collections are organised as folders in your Github repository under the following path:

`/outstatic/content/{collection}`

### What's a Document?

A document is what you will be creating and editing more frequently. In the case of our example above, a document would be a blog post.

Documents are saved at: `/outstatic/content/{collection}/{document}`

Imagine we create a blog post titled: *How to raise a dragon* \- the document would be: `/outstatic/content/posts/how-to-raise-a-dragon.md`

Documents contains some data by default:

- **Title**: the title of the document.

- **Content**: comprised of text and images, the content is edited via a simple editor interface.

- **Date**: the date of the document, this can be edited and will be available on the front end via the `publishedAt` variable.

- **Status**: your document can be either `published` or a `draft`. Published documents are visible on the front end.

- **Author**: the author of the document. This field can be edited but it's automatically populated with your Github's profile picture and name.

- **URL Slug** (optional): the slug is automatically created based on the title of the document, but it can also be edited to whatever you want.

- **Description** (optional): a short description of the document.

- **Cover Image** (optional): an image to be used as a cover, open graph image, etc…

You'll be using the Content Editor to edit Documents. To learn more about it, please read: [Content Editor](/docs/the-content-editor).

