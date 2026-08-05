---
'outstatic': patch
---

Encrypt session cookies and derive a unique session key from existing server credentials when no dedicated token secret is configured.

Existing sessions are signed out once on upgrade because previously signed cookies are no longer accepted.
