---
'outstatic': patch
---

Rebuilds of the internal `media.json` manifest now commit as `update media-index [outstatic:config]` instead of `update media "media.json" [outstatic:media]`, so deployment rules that skip `[outstatic:media]` commits no longer skip manifest rebuilds. Slug renames also surface again in commit messages with a `(renamed from <old-slug>)` note, e.g. `update published "New Title" (renamed from old-slug) [outstatic:content]`.
