---
'outstatic': patch
---

Use the `yaml` library to serialize document frontmatter, replacing the in-house stringifier. Date, multiline, array, and reserved-word string values now round-trip cleanly, and unquoted plain scalars produce smaller git diffs on save.
