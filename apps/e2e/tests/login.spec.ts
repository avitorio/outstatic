import { expect, test } from '@playwright/test'
import { assertAuthStateExists } from './support/env'

test.describe('Outstatic login', () => {
  test.beforeAll(() => {
    assertAuthStateExists()
  })

  test('logs out if already authenticated, then logs in again', async ({
    page
  }) => {
    await page.goto('/outstatic')

    const githubLoginLink = page.getByRole('link', {
      name: 'Sign in with GitHub'
    })

    if ((await githubLoginLink.count()) === 0) {
      await page.goto('/api/outstatic/signout')
      await page.goto('/outstatic')
    }

    await expect(githubLoginLink).toBeVisible({ timeout: 60_000 })
    await githubLoginLink.click()

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
          timeout: 90_000,
          intervals: [1000, 2000, 5000, 5000]
        }
      )
      .toBeTruthy()

    await page.goto('/outstatic')
    await expect(
      page.getByRole('link', { name: 'Sign in with GitHub' })
    ).toHaveCount(0)
    await expect(
      page.getByRole('link', { name: 'Dashboard' }).first()
    ).toBeVisible()

    const userResponse = await page.request.get('/api/outstatic/user')
    expect(userResponse.ok()).toBeTruthy()
    const userPayload = (await userResponse.json()) as {
      session?: { user?: { login?: string } }
    }
    expect(userPayload.session?.user?.login).toBeTruthy()
  })
})
