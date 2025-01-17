import { test, expect } from './fixtures.js'

test('should able to add blocked domains and display them', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/popup.html`)

  const input = page.getByTestId('blocked-domain-input')
  const addButton = page.getByTestId('add-button')

  await input.fill('abc.com')
  await addButton.click()

  await input.fill('xyz.com')
  await addButton.click()

  const domains = page.getByTestId('blocked-domains')
  await expect(domains).toHaveCount(2)
  await expect(domains.nth(0)).toHaveText('abc.com')
  await expect(domains.nth(1)).toHaveText('xyz.com')

  await page.reload()
  const domainsAfterReload = page.getByTestId('blocked-domains')
  await expect(domainsAfterReload).toHaveCount(2)
  await expect(domainsAfterReload.nth(0)).toHaveText('abc.com')
  await expect(domainsAfterReload.nth(1)).toHaveText('xyz.com')
})
