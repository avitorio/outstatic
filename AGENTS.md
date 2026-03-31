# Outstatic

## Project Overview

Outstatic is a static site CMS for Next.js that stores content in GitHub repositories. It provides a full-featured dashboard for content management without requiring a database - content is committed directly to the repository as markdown files.

## Monorepo Structure

```
├── packages/outstatic    # Main library (npm package)
├── apps/dev              # Development blog for testing the library
├── apps/docs             # Documentation site (outstatic.com/docs)
└── examples/basic-blog   # Example blog using latest release
```

Changes to `/apps/dev` should be mirrored to `/examples/basic-blog`.

## Development Commands

```bash
# Install dependencies (pnpm required)
pnpm install

# Start dev server (library + dev blog)
pnpm dev

# Start dev server (library + docs)
pnpm dev:docs

# Build all packages
pnpm build

# Run tests
pnpm test

# Run tests for outstatic package only
pnpm test --filter=outstatic

# Run a single test file
cd packages/outstatic && pnpm test -- path/to/file.test.ts

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format <filepath>

# Generate GraphQL types (after modifying queries/mutations)
cd packages/outstatic && pnpm graphql-codegen
```

## Development Workflow

- Development branch is `canary` - all PRs should target this branch
- Point `OST_REPO_BRANCH` to a different branch than your development branch to avoid editor commits polluting your feature branch
- Offline development is limited since Outstatic relies heavily on GitHub API calls

### Environment Setup for apps/dev

Create `.env.local` in `/apps/dev`:

```
OST_GITHUB_ID=YOUR_GITHUB_OAUTH_ID
OST_GITHUB_SECRET=YOUR_GITHUB_OAUTH_SECRET
OST_REPO_SLUG=outstatic
OST_REPO_BRANCH=main
OST_CONTENT_PATH=outstatic/content
OST_MONOREPO_PATH=apps/dev
```

## Architecture

### Package Exports (packages/outstatic)

- `outstatic` - Main export: `Outstatic` server function, API handlers, types
- `outstatic/client` - Client components: `Dashboard`, `OstClient`, `AdminArea`
- `outstatic/server` - Server utilities for fetching content
- `outstatic/utils/auth` - Authentication utilities
- `outstatic/utils/hooks` - React hooks
- `outstatic/next-plugin` - Next.js configuration plugin
- `outstatic/typegen` - TypeScript type generation for content
- `outstatic/outstatic.css` - Required CSS styles

### Key Directories in packages/outstatic/src

- `app/` - Server-side functions and API route handlers
- `client/` - React dashboard components and pages
- `components/` - Shared React components (ui/ for shadcn-style components)
- `graphql/` - GitHub GraphQL queries, mutations, and generated types
- `utils/` - Utilities including auth, hooks, schemas, metadata handling
- `typegen/` - TypeScript type generation from content schemas
- `cli/` - Command line interface

### Tech Stack

- Next.js 16+ with React 19
- Tiptap for rich text editing
- TailwindCSS 4 for styling
- shadcn/ui component library (in `src/components/ui/shadcn/`)
- React Query for state management (fetches data via GitHub GraphQL API)
- GitHub GraphQL API for content storage
- Jest + Testing Library for tests
- tsup for library bundling

### Routing & API Architecture

**Client Router** ([src/client/router.tsx](packages/outstatic/src/client/router.tsx)):
Custom client-side router using URL segments (`params.ost[]`). Routes include:

- `/` - Dashboard
- `/collections` - Collections list
- `/collections/{slug}` - Custom fields for a collection
- `/{collection}` - Document list
- `/{collection}/{slug}` - Edit document
- `/singletons` - Singletons list
- `/singletons/{slug}` - Edit singleton
- `/singletons/{slug}/fields` - Singleton fields
- `/settings`, `/media-library` - Default pages

**API Handler** ([src/app/api/index.tsx](packages/outstatic/src/app/api/index.tsx)):
`OutstaticApi` exports GET/POST handlers that route to:

- `callback`, `login`, `signout`, `user` - Auth endpoints
- `media` - Media handling
- `generate` - AI generation (POST)

**Client Entry** ([src/client/pages/index.tsx](packages/outstatic/src/client/pages/index.tsx)):

- `OstClient` - Main entry point wrapping providers (QueryClient, ThemeProvider, NavigationGuard)
- `AdminArea` - Layout with header and sidebar
- `Main` - Handles loading states, onboarding, and renders the Router

### GraphQL Code Generation

When creating or modifying GraphQL queries/mutations:

1. Write queries in `src/graphql/queries/` or `src/graphql/mutations/`
2. Run `pnpm graphql-codegen` from `/packages/outstatic`
3. Generated types appear in `src/graphql/gql/`

## Versioning with Changesets

This monorepo uses [@changesets/cli](https://github.com/changesets/changesets) for versioning and changelog generation. **Every PR that changes code in `packages/outstatic` must include a changeset file.**

### Adding a Changeset

Create a markdown file in `outstatic/.changeset/` with a random kebab-case name (e.g., `happy-dogs-fly.md`). The file format is:

```markdown
---
'outstatic': patch
---

Short description of the change.
```

- **`patch`** - Bug fixes, minor improvements, refactors (use this by default)
- **`minor`** - New features, non-breaking additions
- **`major`** - Breaking changes

### Rules

- Only `outstatic` needs to be listed — `docs` and `outstatic-dev-blog` are ignored in changeset config
- Use `patch` by default. If you believe the change warrants a `minor` tag ask first. Only use `major` for breaking changes.
- The description should be a concise, user-facing summary of what changed (not implementation details)
- One changeset per PR; multiple changes in a single PR can be described with multiple bullet points in the same changeset

### Example

File: `outstatic/.changeset/fix-sidebar-scroll.md`

```markdown
---
'outstatic': patch
---

Fix sidebar scroll position resetting when navigating between collections.
```

## Testing

Tests are in `packages/outstatic/src/` alongside source files or in `__tests__`/`tests` folders. Uses Jest with jsdom environment and MSW for API mocking.

Path alias `@/` maps to `packages/outstatic/src/` in tests.

## Linting and Formatting

Always run `pnpm lint` and `pnpm format`. If there are errors, then run `pnpm lint:fix` and/or `pnpm format:fix` commands.
