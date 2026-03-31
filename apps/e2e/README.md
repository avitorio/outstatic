# Outstatic E2E (Local, Real GitHub Login)

This folder contains local-only Playwright e2e tests for real GitHub OAuth login and onboarding checks.
The login test covers searching for `avitorio/ost-clean` in onboarding, selecting it when present, and verifying the branch confirmation screen.

## 1) Configure `apps/dev/.env.local`

Use real credentials and repository values:

```bash
OST_GITHUB_ID=YOUR_GITHUB_OAUTH_APP_ID
OST_GITHUB_SECRET=YOUR_GITHUB_OAUTH_APP_SECRET
OST_REPO_OWNER=YOUR_GITHUB_USERNAME_OR_ORG
OST_REPO_SLUG=YOUR_REPOSITORY_SLUG
OST_REPO_BRANCH=main
OST_CONTENT_PATH=outstatic/content
OST_MONOREPO_PATH=apps/dev
OST_GITHUB_CALLBACK_URL=http://localhost:3000/api/outstatic/callback
```

## 2) Install browser

```bash
pnpm --dir apps/e2e install:browsers
```

## 3) Bootstrap authenticated state (one-time)

This opens a headed browser. Complete GitHub login manually.

```bash
pnpm --dir apps/e2e test:setup
```

This writes auth cookies to `apps/e2e/.auth/user.json`.

## 4) Run e2e suite

```bash
pnpm test:e2e
# or: pnpm --dir apps/e2e test
```

## 5) Optional targeted commands

```bash
pnpm --dir apps/e2e test
pnpm --dir apps/e2e test:fast
pnpm --dir apps/e2e test:ui
pnpm --dir apps/e2e report
pnpm --dir apps/e2e test:login
pnpm --dir apps/e2e test:repository-pick
```

## Notes

- If auth state is missing, run `pnpm --dir apps/e2e test:setup` first.
- `OST_REPO_OWNER`, `OST_REPO_SLUG`, `OST_REPO_BRANCH`, and `OUTSTATIC_API_KEY` are ignored during Playwright webServer startup to force onboarding for testing.
- Playwright starts its own web server (`reuseExistingServer: false`) for deterministic onboarding behavior.
- The repository onboarding test searches for `avitorio/ost-clean`, selects it when present, and then asserts the "Confirm your Branch" card.
- This phase intentionally does not run in CI.
