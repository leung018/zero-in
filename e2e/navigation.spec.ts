/* eslint-disable playwright/expect-expect */
import { Page } from '@playwright/test'
import { expect, test } from './fixtures.js'
import { assertWithRetry } from './utils/assertion.js'
import { goToBlockingSettingPage, goToFocusTimer } from './utils/navigation.js'
import { enableSignInFeatureFlag } from './utils/operation.js'

test('should clicking the options button in timer can go to options page', async ({
  page,
  extensionId
}) => {
  await goToFocusTimer(page, extensionId)

  await page.getByTestId('options-button').click()

  await assertOpenedOptionsPage(page)
})

test('should clicking the sign in button go to sign in page', async ({ page, extensionId }) => {
  await goToFocusTimer(page, extensionId)

  await enableSignInFeatureFlag(page)
  await page.reload()

  await page.getByTestId('sign-in-button').click()

  await assertOpenedSignInPage(page)

  await goToBlockingSettingPage(page, extensionId)

  await page.getByTestId('sign-in-button').click()
  expect(await page.url().includes('sign-in.html')).toBeTruthy()

  // The functionality inside sign In page need to test manually
})

export async function assertOpenedOptionsPage(page: Page) {
  return assertWithRetry(async () => {
    const pages = page.context().pages()
    const optionsPage = pages.find((p) => p.url().includes('options.html'))
    expect(optionsPage).toBeDefined()
  })
}

export async function assertOpenedSignInPage(page: Page) {
  return assertWithRetry(async () => {
    const pages = page.context().pages()
    const signInPage = pages.find((p) => p.url().includes('sign-in.html'))
    expect(signInPage).toBeDefined()
  })
}
