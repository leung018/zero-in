/* eslint-disable playwright/expect-expect */
import { Page } from '@playwright/test'
import { expect, test } from './fixtures.js'
import { assertWithRetry } from './utils/assertion.js'
import { goToFocusTimer } from './utils/navigation.js'

test('should clicking the options button in timer can go to options page', async ({
  page,
  extensionId
}) => {
  await goToFocusTimer(page, extensionId)

  await page.getByTestId('options-button').click()

  await assertOpenedOptionsPage(page)
})

export async function assertOpenedOptionsPage(page: Page) {
  return assertWithRetry(async () => {
    const pages = page.context().pages()
    const optionsPage = pages.find((p) => p.url().includes('options.html'))
    expect(optionsPage).toBeDefined()
  })
}
