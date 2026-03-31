---
title: "Introduction"
status: "published"
author:
  name: "Andre Vitorio"
  picture: "https://avatars.githubusercontent.com/u/1417109?v=4"
slug: "introduction"
description: ""
coverImage: ""
publishedAt: "2024-10-30T03:00:00.000Z"
---

Outstatic is a content management system (CMS) for websites using markdown.

The concept is simple: write content, click save, and see the changes on your website.

Outstatic runs on Next.js but supports markdown editing from any GitHub repository, making it compatible with frameworks such as Astro, Gatsby, Nextra or any other static site generator.

You can get started by visiting our [Getting started](/getting-started) section. If you want to learn a bit more about Outstatic, keep reading.

## How does Outstatic work?

We provide you with a user interface to create and edit markdown content. There is no database or server to set up: **all the data is added to your GitHub repository**.

In the case that you are developing your site locally, you'll need to pull the changes to see them on your dev environment.

Your site's content is organised into three parts: **Collections**, **Documents**, and **Singletons**.

### What are Collections?

Collections are used to organise and define the types of content on your website. Think of them as categories. For example, in the case of a blog, you might create a **Posts** collection to hold your posts. Each post in the collection will be a post document.

Collections form the structure of your website, so you probably won't be creating them often. When you log in to your Outstatic dashboard for the first time, you'll be asked to create a **Collection**.

Collections are organised as folders in your GitHub repository, for example:

`/outstatic/content/{collection}`

### What's a Document?

A Document is what you will be creating and editing more frequently. In the case of our example above, a Document would be a blog post and saved at:

`/outstatic/content/{collection}/{document}`

Imagine we create a blog post titled: *How to raise a dragon* - the full document path would be: `/outstatic/content/posts/how-to-raise-a-dragon.mdx`

Documents contains some data by default:

- **Title**: the title of the Document.

- **Content**: comprising text and images, Content is edited via a simple editor interface.

- **Date**: the date the Document was published. This can be edited and will be available on the frontend as the `publishedAt` variable.

- **Status**: Documents can be in either `published` or `draft` status. Published Documents are visible on your website.

- **Author**: who created the Document. This field is automatically populated with your GitHub name and avatar, but can be edited.

- **URL Slug** (optional): this is created automatically based on the Document title, but can be edited.

But you are not limited to the above, you can also add [Custom Fields](/custom-fields) to your documents.

### What are Singletons?

Singletons are single, unique content items—as opposed to Collections which contain multiple documents. Use Singletons for standalone pages or content that only exists once, such as your homepage, about page, site settings, or footer content.

| Aspect | Collections | Singletons |
|--------|-------------|------------|
| Instance Count | Multiple documents | Single instance |
| Use Case | Blog posts, products, team members | Homepage, about page, site settings |

Singletons are stored in the `_singletons` directory within your content folder:

`/outstatic/content/_singletons/{singleton}.md`

You can create singletons from the dashboard by navigating to the **Singletons** page, or import existing Markdown files from anywhere in your repository.

Just like Collections, Singletons support [Custom Fields](/custom-fields). Custom field schemas for singletons are stored as `{slug}.schema.json` in the `_singletons` directory.

Next: the [Content Editor](/the-content-editor), which is used to edit Documents.