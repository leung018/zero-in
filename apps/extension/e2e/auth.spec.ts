import { expect, test } from './fixtures.js'
import { changeFocusDuration } from './utils/interactions/testing-config.js'
import {
  goToBlockingSettingPage,
  goToFocusTimer,
  goToTestingConfigPage
} from './utils/navigation.js'
import { signIn } from './utils/operation.js'

test('should sign in and sign out buttons render according to state of authentication', async ({
  page,
  extensionId
}) => {
  await goToBlockingSettingPage(page, extensionId)

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

  await expect(page.getByTestId('sign-in-button')).toBeVisible()

  await signIn(page)
  await page.reload()

  await expect(page.getByTestId('sign-in-button')).toBeHidden()
})

test('should sign in trigger restart of service worker so that the timer config is updated', async ({
  page,
  extensionId
}) => {
  await goToTestingConfigPage(page, extensionId)
  await changeFocusDuration(page, 60)

  await goToFocusTimer(page, extensionId)

  await signIn(page)
  await page.reload()

  // Before sign in: set focus duration to 1 minute
  // After sign in: service worker restarts → config resets → should not be 1 minute anymore
  await expect(page.getByTestId('timer-display')).not.toContainText('01:00')
})
