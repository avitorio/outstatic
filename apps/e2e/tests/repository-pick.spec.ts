import { expect, test } from '@playwright/test'
import { assertAuthStateExists } from './support/env'

const TARGET_REPOSITORY = process.env.E2E_TARGET_REPOSITORY?.trim()

test.describe('Outstatic repository onboarding', () => {
  test.beforeAll(() => {
    assertAuthStateExists()
  })

  test('searches and selects target repository, then shows Confirm your Branch', async ({
    page
  }) => {
    test.setTimeout(90_000)
    test.skip(
      !TARGET_REPOSITORY,
      'Set E2E_TARGET_REPOSITORY (for example: "owner/repo") to run this test.'
    )

    const targetRepository = TARGET_REPOSITORY!

    const cardTitle = (name: string) =>
      page.locator('[data-slot="card-title"]', { hasText: name }).first()

    await page.goto('/outstatic')

    await expect(
      page.getByRole('link', { name: 'Sign in with GitHub' })
    ).toHaveCount(0)

    const pickRepositoryHeading = cardTitle('Pick your Repository')
    try {
      await expect(pickRepositoryHeading).toBeVisible({ timeout: 10_000 })
    } catch {
      const confirmBranchHeading = cardTitle('Confirm your Branch')

      if (await confirmBranchHeading.isVisible().catch(() => false)) {
        throw new Error(
          'Repository picker is not available because a repository is already selected (landed on "Confirm your Branch"). Ensure Playwright starts its own web server and that repo defaults/OUTSTATIC_API_KEY are not forcing a repository.'
        )
      }

      throw new Error(
        'Expected "Pick your Repository" onboarding screen, but it did not appear.'
      )
    }

    const repoCombobox = page.locator('button[role="combobox"]').first()
    const searchInput = page.getByPlaceholder('Ex: avitorio/outstatic')

    await expect(repoCombobox).toBeVisible({ timeout: 10_000 })
    await repoCombobox.click()
    await expect(searchInput).toBeVisible({ timeout: 10_000 })
    await searchInput.fill(targetRepository)

    const optionByRole = page
      .getByRole('option', { name: targetRepository })
      .first()
    const optionByCmdk = page
      .locator('[cmdk-item]')
      .filter({ hasText: targetRepository })
      .first()
    const startedAt = Date.now()
    const timeoutMs = 15_000

    while (
      (await optionByRole.count()) === 0 &&
      (await optionByCmdk.count()) === 0 &&
      Date.now() - startedAt < timeoutMs
    ) {
      await page.waitForTimeout(400)
    }

    if ((await optionByRole.count()) === 0 && (await optionByCmdk.count()) === 0) {
      throw new Error(
        `Repository "${targetRepository}" was not found in search results for this account. Update E2E_TARGET_REPOSITORY to a repository visible to the authenticated user.`
      )
    }

    if ((await optionByRole.count()) > 0) {
      await optionByRole.click()
    } else {
      await optionByCmdk.click()
    }

    await expect(cardTitle('Confirm your Branch')).toBeVisible({
      timeout: 30_000
    })
  })
})
