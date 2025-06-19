---
title: "The content editor"
status: "published"
author:
  name: "Andre Vitorio"
  picture: "https://avatars.githubusercontent.com/u/1417109?v=4"
slug: "the-content-editor"
description: "Learn how the Outstatic Content Editor works."
coverImage: ""
publishedAt: "2024-11-16T03:00:00.000Z"
---

The content editor is the main tool used for editing documents. It's where you'll be writing your content, adding links, images, etc…

## Writing content

You can write content in the editor as if you would on any other text editor. The editor supports some markdown syntax, for example, typing `##` when starting a new line will transform it into an H2 heading.

![](/docs/images/markdown-example-c4MT.gif)

Any text you write inside the content editor can be modified and stylised using the editor menus.

## Menus

There are two main menus used while editing content. The **selection menu** and the **slash command menu.**

The selection menu appears whenever you select content within the editor. It helps you turn the current selected word or node into other elements. You can easily add bold, italics, links, etc…

![](/docs/images/selection-menu-2-Y2MD.gif)

The slash command menu appears whenever you type `/`. It allows you to create headings, add images, code blocks, quotes, etc... You can either use the arrow keys to navigate the commands or start typing to filter them.

![](/docs/images/slash-command-ex-U1MD.gif)

## Uploading images

You can enhance your documents by incorporating images using various methods: choose the 'Image' command from the **slash command menu**, then select if you want to upload, link to the image or use an already uploaded image from your Media Library. You can also paste your desired picture, or simply drag and drop it into the document.

When you add an image for the first time you will see this:\
![](/docs/images/cleanshot-2024-11-04-at-22.34.52-2x-QyOT.png)

The **Repository Media Path** is where images are stored in your repository. The **Public Media Path** is the corresponding path to your media folder on your frontend.

Outstatic fetches the images directly from GitHub so they can be visualised instantly on the editor.

## AI Completion

Outstatic provides immediate access to **AI completion** functionality, seamlessly integrated and ready to use. This feature is driven by the leveraging OpenAI's API. To harness its capabilities, follow these simple steps:

1. Obtain an OpenAI API key ([get one here](https://platform.openai.com/account/api-keys)).
2. Integrate this key into your system by setting it as an environment variable using the following template:

```bash
OPENAI_API_KEY=sk-XXXXXXXXXXXXXXXXXXXXXXXXX
```

When this is done you will be able to trigger completion in two ways. Through the **slash command menu** by selecting the **Continue writing** option, or by typing `++`.

![](/docs/images/ai-autocomplete-Q2Mj.gif)

Outstatic's AI-powered completions offers you an effortless writing experience by suggesting content continuations and creative directions in real-time.

## Mathematical Expressions

Outstatic supports math expressions using LaTeX format. Example:

$E=mc^2$

You can add them to your Markdown by clicking the Σ icon in the formatting menu. For more details, see GitHub’s [Writing Mathematical Expressions](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/writing-mathematical-expressions) guide.

Please note that only inline expressions are currently supported—block expressions are not yet available.

To render LaTeX in your frontend you will need to install the packages needed for your framework. You can use [katex](https://www.npmjs.com/package/katex), [remark-math](https://www.npmjs.com/package/remark-math) and [rehype-katex](https://www.npmjs.com/package/rehype-katex).

Here's a small example for Next.js:

```bash
pnpm i katex remark-math rehype-katex
```

In your `layout.tsx` files add:

```javascript

import "katex/dist/katex.min.css";
```

And in your  `mdx-bundler`:

```typescript
import { bundleMDX } from 'mdx-bundler'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

export default async function MDXServer(code: string) {
  const result = await bundleMDX({
    source: code,
    mdxOptions(options) {
      ...
      options.remarkPlugins.push(remarkMath as any)
      options.rehypePlugins = options.rehypePlugins ?? []
      options.rehypePlugins.push(rehypeKatex as any)
      ...

      return options
    }
  })

  return result.code
}
```