import { existsSync } from 'node:fs'

export const AUTH_STATE_PATH = '.auth/user.json'

export function assertAuthStateExists() {
  if (!existsSync(AUTH_STATE_PATH)) {
    throw new Error(
      `Missing auth state file at ${AUTH_STATE_PATH}. Run "pnpm e2e:auth" from repo root (or "pnpm test:setup" in apps/e2e) first.`
    )
  }
}
