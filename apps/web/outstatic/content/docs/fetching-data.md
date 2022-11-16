---
title: 'Fetching data'
status: 'published'
author:
  name: 'Andre Vitorio'
  picture: 'https://avatars.githubusercontent.com/u/1417109?v=4'
slug: 'fetching-data'
description: ''
coverImage: ''
publishedAt: '2022-10-13T12:28:25.000Z'
---

We've made it easy for you to fetch the data and content you create with Outstatic by providing a simple API. You should use this API on the front end of your Next.js website.

## Fetching collections

To fetch all your collections, without the documents, use the `getCollections` function. It will return an array of strings, each string being the name of a folder under `/outstatic/content/`.

## Fetching documents

To fetch all the documents from a collection, you should use the `getDocuments` function inside your `getStaticProps` or `getServerSideProps` functions. The `getDocuments` function accepts three parameters: the name of the collection as a string, an array with the fields to be retrieved, and a boolean that determines if we fetch drafts. It returns an array of Documents sorted by date, with the most recent `publishedAt` documents first.

```javascript
// Fetching all documents from a collection

export const getStaticProps = async () => {
  const showDraftPgs = process.env.SHOW_DRAFTS;
  const allPosts = getDocuments('posts', [
    'title',
    'publishedAt',
    'slug',
    'coverImage',
    'description',
    'author'
  ],showDraftPgs)

  return {
    props: { allPosts }
  }
}
```

### Fetching documents by slug

Documents can be fetched by slug, this is usually helpful when using Next.js' [Dynamic Routes](https://nextjs.org/docs/routing/dynamic-routes). The function `getDocumentBySlug` takes four parameters: the name of the collection as a string, the slug of the document, and an array with the fields to be retrieved and a boolean to determine if you want to get draft posts (defaulting to false).

```javascript
// Example of a /pages/posts/[slug].tsx page

export async function getStaticProps({ params }: Params) {
  const showDraftPg = process.env.SHOW_DRAFTS;
  const post = getDocumentBySlug('posts', params.slug, [
    'title',
    'publishedAt',
    'slug',
    'author',
    'content',
    'coverImage'
  ],showDraftPg)
  const content = await markdownToHtml(post.content || '')

  return {
    props: {
      post: {
        ...post,
        content
      }
    }
  }
}
```

Keep in mind that the content is returned as Markdown. In order to convert it to HTML you should use a library such as [remark](https://www.npmjs.com/package/remark). To see an example of how you can use remark to convert Markdown to html, please take a look at our [Blog Example template](https://github.com/avitorio/outstatic/blob/main/examples/blog/src/lib/markdownToHtml.ts).

### Fetching document paths to use with getStaticPaths

We provide a simple helper function so you can easily get all the document paths for a specific collection. This is helpful to feed the array of slugs needed for Next.js to statically generate dynamic routes.

```javascript
// Fetching document paths

export async function getStaticPaths() {
  const showDraftPg = process.env.SHOW_DRAFTS;
  return {
    paths: getDocumentPaths('posts',showDraftPg),
    fallback: false
  }
}
```

## Usage examples:

If you'd like to check out examples of how to use these functions, please refer to our [Example Blog](https://github.com/avitorio/outstatic/tree/main/examples/blog) repository.

