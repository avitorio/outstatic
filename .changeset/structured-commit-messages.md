---
'outstatic': patch
---

Outstatic now generates structured commit messages with the human-readable action first and an `[outstatic:scope]` tag at the end, e.g. `update draft "Post title" [outstatic:content]` and `upload media "hero.jpg" [outstatic:media]`. This makes commit history easy to scan while still letting Vercel's Ignore Build Step or GitHub Actions detect Outstatic commits and skip draft-only or media-only deploys.
