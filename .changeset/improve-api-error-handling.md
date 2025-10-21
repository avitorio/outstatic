---
'outstatic': patch
---

fix: improve API route error handling and type safety for Next.js 15.5.6

- Add proper validation for route parameters in GET and POST handlers
- Return appropriate 400/404 status codes for invalid requests
- Remove unused Request interface and NextResponse import
- Make route parameters optional to match Next.js App Router behavior