# outstatic

## 2.1.11

### Patch Changes

- 36726c3: Fix dynamic Lucide icons so published admin bundles do not require resolving the lucide-react/dynamic subpath.

## 2.1.10

### Patch Changes

- 5367c10: - Add a Block Library for defining reusable MDX blocks and inserting them from the editor slash command.
  - Add a copy button to MDX block code previews in the editor.
  - Avoid marking documents as changed when existing MDX is normalized into custom blocks.
  - Split the block editor dialog into a 3-step wizard (basics / props / additional attributes) and add an Additional Attributes field that appends a fixed string of JSX attributes to every inserted instance of the block.
  - Fix blocks configured with Additional Attributes reopening as raw MDX instead of the editable block UI.
  - Add block library icon picking support and update block metadata handling for JSX block insertion.
  - Fix block library String attributes being HTML-escaped on save (e.g. `&` written as `&amp;` in URLs like YouTube embed links).
  - Avoid rescanning the full editor document for block metadata on selection-only transactions.
  - Restrict block library configuration actions to users with collection management permission.
- 5367c10: Make block library cards keyboard-accessible for editing.
- c509b92: Show an Outstatic-branded favicon while on the dashboard, restoring the host site's favicon when you navigate away.
- 54470f9: Add Fields only mode for collection and singleton edit pages.
- 54470f9: Fix status selector being unavailable on mobile when fields-only mode is enabled.
- 119db4c: Fix frontmatter serializer producing invalid YAML when documents contain array fields such as Tags.
- 5367c10: Focus the first prop field after inserting a registered MDX block.
- 634142f: Show the confirm (check) button in the editor link popover once the URL input is edited, so changes to an existing link can be saved instead of only removed.
- 7759b83: Turn selected editor text into a link when pasting a URL over it.
- 54470f9: Auto-generate slug from title in fields-only mode when creating new documents.
- 119db4c: Add a rich text custom field that stores markdown in document frontmatter.
- 84dccd4: Add drag-and-drop reordering for custom fields in the field management page and persist field order updates to schema commits.
- 7759b83: Reject relative editor link paths that contain raw whitespace or control characters (they are not valid literal href values).
- 119db4c: Use the `yaml` library to serialize document frontmatter, replacing the in-house stringifier. Date, multiline, array, and reserved-word string values now round-trip cleanly, and unquoted plain scalars produce smaller git diffs on save.

## 2.1.9

### Patch Changes

- update code editor colors

## 2.1.8

### Patch Changes

- cfa8cac: Preserve raw MDX and HTML blocks in the editor without escaping component tags, and improve MDX block validation and parsing performance.
- 5d41de3: Refactor documents and singletons tables to use the shadcn DataTable component (built on `@tanstack/react-table`).
- a509f19: Outstatic now generates structured commit messages with the human-readable action first and an `[outstatic:scope]` tag at the end, e.g. `update draft "Post title" [outstatic:content]` and `upload media "hero.jpg" [outstatic:media]`. Rebuilds of the internal `media.json` manifest commit as `update media-index [outstatic:config]` (not `[outstatic:media]`) so deployment rules that skip media-only commits do not also skip manifest rebuilds. Slug renames surface in commit messages with a `(renamed from <old-slug>)` note, e.g. `update published "New Title" (renamed from old-slug) [outstatic:content]`. Together this makes commit history easy to scan while still letting Vercel's Ignore Build Step or GitHub Actions detect Outstatic commits and skip draft-only or media-only deploys.

## 2.1.7

### Patch Changes

- 095aab0: Show an error toast when media deletion cannot fetch the latest repository data before deleting.
- 467f0c2: Fix singleton title and slug updates so the sidebar stays in sync after saving.
- 6b15f15: Fix hydration mismatches from the PRO upgrade dialog trigger.
- 095aab0: - Serialize mixed-source media uploads so `media.json` updates do not race.
  - Prevent media rebuilds from rewriting `media.json` when a configured source fails to load.
  - Add support for configuring multiple media sources with per-folder file type rules.
  - Add bulk selection and deletion controls to the media library.
  - Add media library preview dialogs for image and video files.
  - Add contextual help tooltips to media source settings.
  - Make media repository paths selectable only through the GitHub folder selector.
  - Replace the media library delete icon with an actions menu that can delete files, open them on GitHub, or copy their output URL.
  - Prevent duplicate media source labels from progressing through setup.
  - Keep the media picker source filter and selected image in sync.
  - Fix rebuilt media library items receiving identical hashes.
  - Preserve existing media item upload timestamps when rebuilding `media.json`.
  - Fix media source path validation and overlapping path resolution.
  - Use ISO timestamps when rebuilding `media.json`.
  - Fix the media settings dialog accessibility warning without adding a visible title.
  - Fix document editor state when navigating between existing documents without unmounting.
  - Fix singleton editors reloading stale content when navigating between entries.
  - Guard the media library when no media sources are configured.
- 034a171: Add a media library settings button next to the Add Media action.
- ad29f23: Keep cached collections and singletons visible when GitHub metadata fetches hit a temporary bad credentials error.

## 2.1.6

### Patch Changes

- ca91109: Allow dragging and dropping images into the media library and image picker uploads.
- 49f581a: Update collection headers and restrict collection create, delete, and settings actions to users with collection management permissions.
- 33bd3ac: Fix Safari editor bubble-menu popovers opening in the wrong position for link and node selectors.
- d5c4942: Preserve explicit empty author metadata so removing an avatar does not repopulate it from the current session.

## 2.1.5

### Patch Changes

- 150bd04: Improve basic blog content parsing
- fd79e27: Allow GitHub OAuth login without an email address on the user's account.
- 0900d6f: Improve validation messages for required custom date fields.
- 7be7c57: fix: custom date field validation failing on document edit by @mathieudutour
- 606addd: Allow embedded Outstatic dashboards to disable the package toaster to avoid duplicate notifications.
- 84df573: Fix table missing headers by @TcMits

## 2.1.4

### Patch Changes

- 313e233: - Allow seeding tag suggestions when creating a Tags custom field.
  - Keep field dialogs open when schema commits fail so editors can retry.
- 507d73f: Fix the singleton editor view not refreshing when creating a new singleton from the sidebar.
- 5083c77: Replace tag inputs and column pickers with local multi-select comboboxes.
- e9b2998: Refactor the document and singleton editors to share common page and form state logic.
- 466670a: Add a strict single-select custom field type with schema-defined options.
- 1a2ce4b: Refactor collection and singleton field management to share one implementation and fix field schema commit messages for edits.

## 2.1.3

### Patch Changes

- 7b6fd94: - Add a Bugs & Ideas sidebar item that opens the Outstatic Featurebase board in a new tab.
  - Refactor Settings cards to use structured card headers and descriptions instead of prose styling classes.
- 273e2f1: Export additional `outstatic/client` helpers (`RootProvider`, `Sidebar`, `SidebarProvider`, and `useLocalData`) for custom dashboard integrations.

  Avoid showing the V2 upgrade warning when an Outstatic root container (`#outstatic`) is already present.

## 2.1.2

### Patch Changes

- Refactor codebase

## 2.1.1

### Patch Changes

- 5857dff: feat: add Vercel's AI Gateway as an auto-complete option

## 2.1.0

### Minor Changes

- 603350f: Adds support for Outstatic PRO

## 2.1.0-canary.0

### Minor Changes

- Adds support for Outstatic PRO

## 2.0.18

### Patch Changes

- 01a866b: Add configurable default markdown extension (md/mdx) for new documents. Users are prompted to choose their preferred format on first save, and can change it later in Settings.
- 1d8c62c: Refactored the onboarding flow with clear separation
- c0eb97e: update onboarding
- 937b475: Nicer type generation output by @mathieudutour

## 2.0.17

### Patch Changes

- 46b4560: Update examples and fix errors

## 2.0.17-canary.0

### Patch Changes

- Update examples and fix errors

## 2.0.16

### Patch Changes

- fix: typescript errors for compatibility

## 2.0.15

### Patch Changes

- 22d76fa: Update the dependencies to work with nextjs 16 by @mathieudutour
- fef254b: Separate content from settings by @mathieudutour
- 9e65b10: feat: implement collapsible state management for sidebar navigation
- 6090714: Add an action to copy the error logs on every toast.error by @mathieudutour
- 1845b19: Singletons and types by @mathueudutour

## 2.0.14

### Patch Changes

- fix: "Your document contains media files" keeps popping up

## 2.0.13

### Patch Changes

- Fix React Server Components CVE vulnerabilities

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
