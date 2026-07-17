---
'outstatic': patch
---

Fix "Cannot read properties of null (reading 'removeChild')" crash on dashboard navigation caused by the favicon override detaching the host site's React-managed icon links.
