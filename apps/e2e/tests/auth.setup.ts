import { expect, test } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { AUTH_STATE_PATH } from './support/env'

test.describe('GitHub auth bootstrap', () => {
  test('stores authenticated browser state after manual login', async ({
    page,
    context
  }) => {
    test.setTimeout(5 * 60 * 1000)

    await page.goto('/outstatic')

    const githubLoginLink = page.getByRole('link', {
      name: 'Sign in with GitHub'
    })
    await expect(githubLoginLink).toBeVisible({ timeout: 60_000 })
    await githubLoginLink.click()

    // Wait for manual GitHub completion by polling session endpoint.
    await expect
      .poll(
        async () => {
          const userResponse = await page.request.get('/api/outstatic/user')
          if (!userResponse.ok()) return null

          const userPayload = (await userResponse.json()) as {
            session?: { user?: { login?: string } }
          }

          return userPayload.session?.user?.login ?? null
        },
        {
          timeout: 5 * 60 * 1000,
          intervals: [1000, 2000, 5000, 5000],
          message:
            'Complete GitHub login in the opened browser and return to Outstatic.'
        }
      )
      .toBeTruthy()

    // Re-open dashboard to confirm login UI is gone before persisting state.
    await page.goto('/outstatic')
    await expect(
      page.getByRole('link', { name: 'Sign in with GitHub' })
    ).toHaveCount(0)

    const storageState = await context.storageState()
    storageState.origins = []

    await mkdir(path.dirname(AUTH_STATE_PATH), { recursive: true })
    await writeFile(AUTH_STATE_PATH, JSON.stringify(storageState, null, 2))
  })
})
