import { expect, test } from './fixtures.js'
import { goToBlockingSettingPage, goToFocusTimer } from './utils/navigation.js'
import { enableSignInFeatureFlag, signIn } from './utils/operation.js'

test('should sign in and sign out buttons render according to state of authentication', async ({
  page,
  extensionId
}) => {
  await goToBlockingSettingPage(page, extensionId)

  // hidden by default without enable feature flag
  await expect(page.getByTestId('sign-in-button')).toBeHidden()

  await enableSignInFeatureFlag(page)
  await signIn(page)
  await page.reload()

  await expect(page.getByTestId('sign-out-button')).toBeVisible()
  await expect(page.getByTestId('sign-in-button')).toBeHidden()

  await page.getByTestId('sign-out-button').click()

  await expect(page.getByTestId('sign-in-button')).toBeVisible()
  await expect(page.getByTestId('sign-out-button')).toBeHidden()
})

test('should render sign in button in popup when user has not authenticated', async ({
  page,
  extensionId
}) => {
  await goToFocusTimer(page, extensionId)

  // hidden by default without enable feature flag
  await expect(page.getByTestId('sign-in-button')).toBeHidden()

  await enableSignInFeatureFlag(page)
  await page.reload()

  await expect(page.getByTestId('sign-in-button')).toBeVisible()

  await signIn(page)
  await page.reload()

  await expect(page.getByTestId('sign-in-button')).toBeHidden()
})
