---
'outstatic': patch
---

Outstatic now generates structured commit messages with the human-readable action first and an `[outstatic:scope]` tag at the end, e.g. `update draft "Post title" [outstatic:content]` and `upload media "hero.jpg" [outstatic:media]`. Rebuilds of the internal `media.json` manifest commit as `update media-index [outstatic:config]` (not `[outstatic:media]`) so deployment rules that skip media-only commits do not also skip manifest rebuilds. Slug renames surface in commit messages with a `(renamed from <old-slug>)` note, e.g. `update published "New Title" (renamed from old-slug) [outstatic:content]`. Together this makes commit history easy to scan while still letting Vercel's Ignore Build Step or GitHub Actions detect Outstatic commits and skip draft-only or media-only deploys.
