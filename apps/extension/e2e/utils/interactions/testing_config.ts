import { Page } from '@playwright/test'

export async function changeFocusDuration(page: Page, seconds: number) {
  const input = page.getByTestId('focus-duration')
  await input.fill(seconds.toString())
  await page.getByTestId('testing-config-save-button').click()
}
