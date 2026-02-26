import { defineConfig, devices } from '@playwright/test'
import { existsSync } from 'node:fs'

const authStatePath = '.auth/user.json'
const hasAuthState = existsSync(authStatePath)

export default defineConfig({
  testDir: './tests',
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'pnpm --dir ../dev dev --hostname 127.0.0.1 --port 3000',
    url: 'http://localhost:3000/outstatic',
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      ...process.env,
      OUTSTATIC_API_KEY: '',
      OST_REPO_OWNER: '',
      OST_REPO_SLUG: '',
      OST_REPO_BRANCH: ''
    },
    gracefulShutdown: {
      signal: 'SIGTERM',
      timeout: 5_000
    }
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome']
      }
    },
    {
      name: 'chromium',
      testIgnore: /auth\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: hasAuthState ? authStatePath : undefined
      }
    }
  ]
})
