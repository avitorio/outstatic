---
title: 'Custom Fields'
status: 'draft'
author:
  name: 'Andre Vitorio'
  picture: 'https://avatars.githubusercontent.com/u/1417109?v=4'
slug: 'custom-fields'
description: ''
coverImage: ''
publishedAt: '2022-11-09T21:01:41.557Z'
---

## Adding custom fields

Explanation of how to add custom fields

```json
// file: /outstatic/content/recipes/schema.json
{
  "cuisine": {
    "type": "string",
    "label": "Specify the cuisine.",
    "required": true
  },
  "ingredients": {
    "type": "text",
    "label": "Create a short paragraph."
  }
}
```

