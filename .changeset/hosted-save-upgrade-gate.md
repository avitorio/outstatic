---
'outstatic': patch
---

Add `isHosted` option to `Outstatic()` so hosted deployments can gate saving documents and singletons behind a Pro upgrade. When `isHosted` is true and the project is not Pro, the editor's save action opens the upgrade dialog and links directly to checkout in a new tab. Hosted deployments can grant content save access separately from Pro status, so legacy access can save content without unlocking other Pro features. Self-hosted users are unaffected.
