---
title: 'Migrating to v1'
status: 'published'
author:
  name: 'Andre Vitorio'
  picture: 'https://avatars.githubusercontent.com/u/1417109?v=4'
slug: 'migrating-to-v1'
description: 'Migrating Outstatic to >v1.0.0'
coverImage: ''
publishedAt: '2023-11-11T18:59:51.912Z'
---

In v1 we are dropping support for the `/pages` folder and will only be working with the `/app` directory in Next.js. The migration is quite simple. 

Start by upgrading Outstatic.

```bash
# npm
npm install outstatic@latest

# yarn
yarn add outstatic@latest

#pnpm
pnpm install outstatic@latest
```

Then, remove the `outstatic` and `api/outstatic` folders from your `/pages` directory.

Next, you'll need to add two files to your `/app` folder:

`/app/outstatic/[[...ost]]/page.tsx`

```javascript
import 'outstatic/outstatic.css'
import { Outstatic } from 'outstatic'
import { OstClient } from 'outstatic/client'

export default async function Page({ params }: { params: { ost: string[] } }) {
  const ostData = await Outstatic()
  return <OstClient ostData={ostData} params={params} />
}
```

And `/app/api/outstatic/[[...ost]]/route.ts`

```javascript
import { OutstaticApi } from 'outstatic'

export const GET = OutstaticApi.GET

export const POST = OutstaticApi.POST
```

That's it. Start your dev server and you are good to go!