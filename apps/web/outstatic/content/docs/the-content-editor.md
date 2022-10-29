---
title: 'The content editor'
status: 'published'
author:
  name: 'Andre Vitorio'
  picture: 'https://avatars.githubusercontent.com/u/1417109?v=4'
slug: 'the-content-editor'
description: ''
coverImage: ''
publishedAt: '2022-10-13T12:26:38.000Z'
---

The content editor is the main tool used for editing documents. It's where you'll be writing your content, adding links, images, etc…

## Writing content

You can write content in the editor as if you would on any other text editor. The editor supports some Markdown syntax. For example, typing `##` when starting a new line will transform it into an h2 heading.

![An example of the content editor in use: two hash symbols ("##") automatically turn into an h2-level heading.](/images/markdown-example-YzOD.gif)

Any text you write inside the content editor can be modified and stylised using the editor menus.

## Menus

There are two main menus used while editing content: the **selection menu** and the **floating menu.**

### Selection menu

The selection menu appears whenever you select content within the editor. It helps you turn the currently selected word or node into another element. You can easily add bold, italics, links, etc…

![Text being made italic and bold using the floating selection menu](/images/selection-menu-2-Y2MD.gif)

## Floating menu

The floating menu appears on new blank lines. It allows you to quickly create headings, add images, code blocks, and blockquotes.

![The floating menu being used to quickly create a new heading](/images/floating-menu-g2OT.gif)

## Uploading images

You can add images to a Documents by clicking the image button on the floating menu.

![The image button on the floating menu being used to quickly insert an image](/images/image-menu-U2ND.gif)

Images are uploaded to your `/public/images` folder. Outstatic fetches the images directly from GitHub so they can be seen instantly on the editor, even if your website isn't yet fully deployed.
