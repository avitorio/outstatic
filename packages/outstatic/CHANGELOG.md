# outstatic

## 2.0.12

### Patch Changes

- f6267a4: Apply React RSC fix

## 2.0.11

### Patch Changes

- badf81d: refactor: retire old alert component
- ce51c83: fix: improve API route error handling and type safety for Next.js 15.5.6

  - Add proper validation for route parameters in GET and POST handlers
  - Return appropriate 400/404 status codes for invalid requests
  - Remove unused Request interface and NextResponse import
  - Make route parameters optional to match Next.js App Router behavior

- 514b821: Add scrollThreshold and scrollMargin to editor

## 2.0.10

### Patch Changes

- 6736633: chore: remove unused dependencies and refactor auth callback logic
- 080c75b: feat: update branch search component style
- 013ce65: Fix: Empty name error
- 6139349: chore: replace hapi/iron with jose
- b7de2a7: Refactor code

## 2.0.9

### Patch Changes

- 4eb536e: Refactor auth
- 8f02bc6: fix how autolinks are parsed to markdown
- bf4bd61: Update shadcn/ui styles
- a8cea78: Fix: new collection content lock
- da7b9e8: Update Packages & Install Manypkg
- 8a67834: Add tests to DocumentSettings
- 34837b3: - Improve Dark Mode with ShadCN theme classes (#302)
- c3f9d6e: Fix: Author not being auto filled
- 91f0b72: fix: media gallery dialog
- 2bf467f: Add shadcn/ui accordion to custom fields
- 158bcb1: Fix: custom field modal width
- 227bfb5: Adjust onboarding styles
- a70040a: fix: next-themes hydration error
- b6fbe7d: fix ai autocomplete

## 2.0.8

### Patch Changes

- Add math examples

## 2.0.7

### Patch Changes

- 14163b2: Fix math notation
- 1089131: fix math extension

## 2.0.7-canary.1

### Patch Changes

- fix math extension

## 2.0.7-canary.0

### Patch Changes

- Fix math notation

## 2.0.6

### Patch Changes

- OAuth: Handle refresh tokens when available (#301). Thanks @mathieudutour

## 2.0.5

### Patch Changes

- 6310e2e: fix: save button disabled on change

## 2.0.4

### Patch Changes

- 9797239: Add support for math expressions
- 7c875d2: Fix Document Settings' Image component not triggering setHasChanges
- 36f7b88: Fix weird shadcn dialog animation

## 2.0.4-canary.5

### Patch Changes

- 9797239: Add support for math expressions

## 2.0.4-canary.0

### Patch Changes

- 7c875d2: Fix Document Settings' Image component not triggering setHasChanges
- 36f7b88: Fix weird shadcn dialog animation

## 2.0.3

### Patch Changes

- c7a049e: Adds correct peer dependencies for v2.

## 2.0.2

### Patch Changes

- fix: use regular img element for media library

## 2.0.1

### Patch Changes

- fix relative path links

## 2.0.0

### Major Changes

- 13c4309: Outstatic v2.0 offers support for Next.js 15. If you are using Next.js 14, please use v1.4.

  ### Styles

  We've added a few components which are styled using a `outstatic` css namespace (id).

  To make sure your dashboard works with the new styles, you should add the id to your `app/(cms)/layout.tsx`'s `body` tag.

  `/app/(cms)/layout.tsx`

  ```javascript
  export default function RootLayout({ children }) {
    return (
      <html lang="en">
        <body id="outstatic">{children}</body>
      </html>
    )
  }
  ```

  ### Media Files (No code changes needed)

  We are now using a **Media Library** page. You will have to define a **Repo Media Path** and a **Public Media Path**. You will be prompted to set up your paths either from the Media Library page or when trying to upload an image to a document.

  It should work the same as before, but with the Media Gallery you will be able to easily reuse images you've already uploaded to your repository.

- f13ba35: 2.0.0 start

### Minor Changes

- a0c13ef: feat: detached mode
  feat: delete collection on detached mode
  feat: improve repo and branch selection
  feat: update rebuild metadata to use react-query
  feat: replace useoid with react query
  feat: use react-query for custom fields
  feat: remove apollo
  refactor: reuse graphql client
  feat: redesign sidebar
  feat: adjust main wrapper
  fix: branch search not showing results if arraylength 1 on
  feat: create media library
  feat: create branch option if branch not found
  feat: v1.5 docs
  feat: add fair license

### Patch Changes

- fab75d9: fix prosemirror error
- e81ff20: feat: adjust onboarding when .env vars are present
- b902a0f: upgrade to tailwindcss v4

## 2.0.0-canary.3

### Patch Changes

- b902a0f: upgrade to tailwindcss v4

## 2.0.0-canary.2

### Patch Changes

- fix prosemirror error

## 2.0.0-canary.2

### Major Changes

- Outstatic v2.0 offers support for Next.js 15. If you are using Next.js 14, please use v1.4.

  #### Styles

  We've added a few components which are styled using a `outstatic` css namespace (id).

  To make sure your dashboard works with the new styles, you should add the id to your `app/(cms)/layout.tsx`'s `body` tag.

  `/app/(cms)/layout.tsx`

  ```javascript
  export default function RootLayout({ children }) {
    return (
      <html lang="en">
        <body id="outstatic">{children}</body>
      </html>
    )
  }
  ```

  #### Media Files (No code changes needed)

  We are now using a **Media Library** page. You will have to define a **Repo Media Path** and a **Public Media Path**. You will be prompted to set up your paths either from the Media Library page or when trying to upload an image to a document.

  It should work the same as before, but with the Media Gallery you will be able to easily reuse images you've already uploaded to your repository.

### Patch Changes

- e81ff20: feat: adjust onboarding when .env vars are present

## 1.5.0-canary.0

### Minor Changes

feat: detached mode
feat: delete collection on detached mode
feat: improve repo and branch selection
feat: update rebuild metadata to use react-query
feat: replace useoid with react query
feat: use react-query for custom fields
feat: remove apollo
refactor: reuse graphql client
feat: redesign sidebar
feat: adjust main wrapper
fix: branch search not showing results if arraylength 1 on
feat: create media library
feat: create branch option if branch not found
feat: v1.5 docs
feat: add fair license

## 1.4.9

### Patch Changes

- e8ea476: Fix document sorting
- c3495a4: Add boolean custom field

## 1.4.8

### Patch Changes

- 506a070: Add new post button to sidebar

## 1.4.7

### Patch Changes

- cd43d9a: Add table to examples

## 1.4.6

### Patch Changes

- ignore .next on package build

## 1.4.5

### Patch Changes

- 5dc8e8f: feat: add table support

## 1.4.4

### Patch Changes

- 8f1bb44: Feat/add some shadcn

## 1.4.3

### Patch Changes

- f5b4ce0: fix: blob type error
- 6507630: Remove OST_TOKEN_SECRET as requirement

## 1.4.2

### Patch Changes

- 116171b: feat: add base path functionality
- 7215826: Update fillRule tag
- 6e7b37d: fix: Remove double border in aside

## 1.4.1

### Patch Changes

- Fix getDocuments null error

## 1.4.0

### Minor Changes

- a509ad3: Fixes coverImage bug
- 70650b7: Add discord server to dashboard footer

### Patch Changes

- 3b2eb5d: fix: don't auto create links from 'https://'

## 1.3.0

### Minor Changes

- 7e1405c: Use @ for imports and refactor Outstatic context
- d7165a6: Adds column sorting on list page

### Patch Changes

- 8fd6ea7: Add title to Outstatic pages

## 1.2.0

### Minor Changes

- 2a45807: Editor now works on mobile (for the most part)

### Patch Changes

- 61c35ff: Fix slugs not being saved properly

## 1.1.0

### Minor Changes

- Fix AI Completion deleting itself

### Patch Changes

- 11a297f: Add exit intercept for links inside the admin

## 1.0.6-canary.0

### Patch Changes

- 11a297f: Add exit intercept for links inside the admin

## 1.0.5

### Patch Changes

- 796efef: feat: remove collections from metadata db
- 3f79373: fix: author name check

## 1.0.4

### Patch Changes

- 38e260e: fix: check for VERCEL_GIT_REPO_SLUG on callback
- 98696b2: Allow to set redirect_uri when logging-in thru GitHub (uses OST_GITHUB_CALLBACK_URL)
- 61351df: fix: undefined process.env.OST_REPO_OWNER
