---
title: 'The content editor'
status: 'published'
author:
  name: 'Andre Vitorio'
  picture: 'https://avatars.githubusercontent.com/u/1417109?v=4'
slug: 'the-content-editor'
description: ''
coverImage: ''
publishedAt: '2022-10-20T12:26:38.000Z'
---

The content editor is the main tool used for editing documents. It's where you'll be writing your content, adding links, images, etc…

## Writing content

You can write content in the editor as if you would on any other text editor. The editor supports some markdown syntax, for example, typing `##` when starting a new line will transform it into an H2 heading.

![](/images/markdown-example-c4MT.gif)

Any text you write inside the content editor can be modified and stylised using the editor menus.

## Menus

There are two main menus used while editing content. The **selection menu** and the **slash command menu.**

The selection menu appears whenever you select content within the editor. It helps you turn the current selected word or node into other elements. You can easily add bold, italics, links, etc…

![](/api/outstatic/images/selection-menu-2-Y2MD.gif)

The slash command menu appears whenever you type `/`. It allows you to create headings, add images, code blocks, quotes, etc... You can either use the arrow keys to navigate the commands or start typing to filter them.

![](/images/slash-command-ex-U1MD.gif)

## Uploading images

You can enhance your documents by incorporating images using various methods: choose the 'Image' command from the **slash command menu**, then select if you want to upload or link to the image. You can also paste your desired picture, or simply drag and drop it into the document.

![](/images/cleanshot-2023-10-20-at-23.07.12-2x-MzNz.png)

Images are uploaded to your `/public/images` folder. Outstatic fetches the images directly from GitHub so they can be visualised instantly on the editor, even if your website hasn't finished deploying.