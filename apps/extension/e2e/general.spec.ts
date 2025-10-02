/* eslint-disable playwright/expect-expect */
import { Page } from '@playwright/test'
import { formatNumber } from '@zero-in/shared/utils/format'
import { expect, test } from './fixtures.js'
import { assertWithRetry } from './utils/assertion.js'
import { changeFocusDuration } from './utils/interactions/testing_config.js'
import {
  goToBlockingSettingPage,
  goToFocusTimer,
  goToNotificationPage,
  goToReminderPage,
  goToStatisticsPage,
  goToTestingConfigPage
} from './utils/navigation.js'
import { sleep, stopServiceWorker } from './utils/operation.js'

// This file aim at testing some dependencies related to chrome/browser extension api and make sure integrate them properly
// e.g. browser.local.storage

test('should able to persist browsing rules and update ui', async ({ page, extensionId }) => {
  await goToBlockingSettingPage(page, extensionId)

  // Add two domains
  await addBlockedDomain(page, 'abc.com')
  await addBlockedDomain(page, 'xyz.com')

  let domains = page.getByTestId('blocked-domain')
  await expect(domains).toHaveCount(2)
  await expect(domains.nth(0)).toHaveText('abc.com')
  await expect(domains.nth(1)).toHaveText('xyz.com')

  // Remove one domain
  await removeBlockedDomain(page, 'abc.com')

  domains = page.getByTestId('blocked-domain')
  await expect(domains).toHaveCount(1)
  await expect(domains.nth(0)).toHaveText('xyz.com')

  // Reload the page
  await page.reload()

  domains = page.getByTestId('blocked-domain')
  await expect(domains).toHaveCount(1)
  await expect(domains.nth(0)).toHaveText('xyz.com')
})

test('should blocking of browsing control function properly', async ({ page, extensionId }) => {
  const extraPage1 = await page.context().newPage()
  const extraPage2 = await page.context().newPage()
  for (const p of [page, extraPage1, extraPage2]) {
    await p.route('https://google.com', async (route) => {
      await route.fulfill({ body: 'This is fake google.com' })
    })
    await p.route('https://facebook.com', async (route) => {
      await route.fulfill({ body: 'This is fake facebook.com' })
    })
  }
  await extraPage1.goto('https://google.com')
  await expect(extraPage1.locator('body')).toContainText('This is fake google.com')

  await extraPage2.goto('https://facebook.com')
  await expect(extraPage2.locator('body')).toContainText('This is fake facebook.com')

  // Add blocked Domain
  await goToBlockingSettingPage(page, extensionId)
  await addBlockedDomain(page, 'google.com')

  // Previous page which is in google.com should be blocked
  await assertInBlockedTemplate(extraPage1)

  // Future request to google.com should be blocked
  await goToAndVerifyIsBlocked(extraPage1, 'https://google.com')

  // Facebook should not be blocked
  await expect(extraPage2.locator('body')).toContainText('This is fake facebook.com')
  await goToAndVerifyIsAllowed(extraPage2, 'https://facebook.com')
})

test("should access blocked domain through other websites won't cause ERR_BLOCKED_BY_CLIENT", async ({
  page,
  extensionId
}) => {
  await goToBlockingSettingPage(page, extensionId)

  await addBlockedDomain(page, 'facebook.com')

  await page.route('https://facebook.com', async (route) => {
    await route.fulfill({ body: 'This is fake facebook.com' })
  })

  await page.route('https://google.com/search-results', async (route) => {
    await route.fulfill({ body: '<a href="https://www.facebook.com">Facebook</a>' })
  })

  await page.goto('https://google.com/search-results')
  await page.click('a')

  await assertInBlockedTemplate(page)
})

test('should browsing control able to unblock domain', async ({ page, extensionId }) => {
  await goToBlockingSettingPage(page, extensionId)

  await addBlockedDomain(page, 'google.com')
  await removeBlockedDomain(page, 'google.com')

  await page.route('https://google.com', async (route) => {
    await route.fulfill({ body: 'This is fake google.com' })
  })
  await goToAndVerifyIsAllowed(page, 'https://google.com')
})

test('should able to persist weekly schedules and update ui', async ({ page, extensionId }) => {
  await goToBlockingSettingPage(page, extensionId)

  // Add a schedule
  await page.getByTestId('check-weekday-sun').check()

  await page.getByTestId('start-time-input').fill('10:00')

  await page.getByTestId('end-time-input').fill('12:00')

  await page.getByTestId('add-schedule-button').click()

  let schedules = page.getByTestId('weekly-schedule')
  await expect(schedules).toHaveCount(1)
  await expect(schedules.nth(0)).toContainText('Sun')
  await expect(schedules.nth(0)).toContainText('10:00 - 12:00')

  // Reload to check if the schedule is persisted
  await page.reload()

  schedules = page.getByTestId('weekly-schedule')
  await expect(schedules).toHaveCount(1)
  await expect(schedules.nth(0)).toContainText('Sun')
  await expect(schedules.nth(0)).toContainText('10:00 - 12:00')
})

test('should able to disable blocking according to schedule', async ({ page, extensionId }) => {
  await goToBlockingSettingPage(page, extensionId)

  await addBlockedDomain(page, 'google.com')

  await page.route('https://google.com', async (route) => {
    await route.fulfill({ body: 'This is fake google.com' })
  })

  await addNonActiveSchedule(page)

  await goToAndVerifyIsAllowed(page, 'https://google.com')
})

test('should focus timer count successfully', async ({ page, extensionId }) => {
  await goToTestingConfigPage(page, extensionId)
  await changeFocusDuration(page, 60 * 25)

  await goToFocusTimer(page, extensionId)

  // Also make sure when service worker is idle and port is disconnected, everything can function properly
  await stopServiceWorker(page)

  await expect(page.getByTestId('timer-display')).toContainText('25:00')

  await page.getByTestId('start-button').click()

  await expect(page.getByTestId('timer-display')).toContainText('24:59')

  await page.getByTestId('pause-button').click()
  await page.reload()
  await page.getByTestId('start-button').click()

  await expect(page.getByTestId('timer-display')).toContainText('24:57')
})

test('should close tab properly after clicking start on reminder page and even after service worker is stopped', async ({
  page,
  extensionId
}) => {
  await goToReminderPage(page, extensionId)

  const extraPage = await page.context().newPage()

  await page.getByTestId('start-button').click()

  // Only close the reminder page only after clicking start button
  await assertWithRetry(async () => {
    expect(page.context().pages()).not.toContain(page)
    expect(page.context().pages()).toContain(extraPage)
  })
})

test('should able to save daily reset time', async ({ page, extensionId }) => {
  await goToStatisticsPage(page, extensionId)

  await page.getByTestId('time-input').fill('10:30')

  await page.getByTestId('daily-reset-time-save-button').click()

  await expect(page.getByTestId('time-input')).toHaveValue('10:30')

  await page.reload()

  await expect(page.getByTestId('time-input')).toHaveValue('10:30')
})

test('should able to change timer config', async ({ page, extensionId }) => {
  await goToTestingConfigPage(page, extensionId)

  await page.getByTestId('focus-duration').fill('10')
  await page.getByTestId('short-break-duration').fill('2')
  await page.getByTestId('long-break-duration').fill('4')
  await page.getByTestId('focus-sessions-per-cycle').fill('3')

  await page.getByTestId('testing-config-save-button').click()
  await page.reload()

  await expect(page.getByTestId('focus-duration')).toHaveValue('10')
  await expect(page.getByTestId('short-break-duration')).toHaveValue('2')
  await expect(page.getByTestId('long-break-duration')).toHaveValue('4')
  await expect(page.getByTestId('focus-sessions-per-cycle')).toHaveValue('3')
})

test('should able to persist the focus sessions record and show it on statistics', async ({
  page,
  extensionId
}) => {
  await goToTestingConfigPage(page, extensionId)
  await changeFocusDuration(page, 1)

  await goToFocusTimer(page, extensionId)
  await page.getByTestId('start-button').click()

  await sleep(1000)
  await goToStatisticsPage(page, extensionId)
  const results = page.getByTestId('completed-focus-sessions')

  try {
    await expect(results.nth(0)).toHaveText('1')
  } catch {
    // To prevent corner case that after completed the focus session, it passed the daily reset time and counted it as record of yesterday
    // eslint-disable-next-line playwright/no-conditional-expect
    await expect(results.nth(1)).toHaveText('1')
  }
})

test('should able to open new tab of reminder page when timer is finished', async ({
  page,
  extensionId
}) => {
  await goToTestingConfigPage(page, extensionId)
  await changeFocusDuration(page, 1)

  await goToFocusTimer(page, extensionId)
  await page.getByTestId('start-button').click()

  await sleep(1000)

  await assertWithRetry(async () => {
    const pages = page.context().pages()
    const reminderPage = pages.find((p) => p.url().includes('reminder.html'))
    expect(reminderPage).toBeDefined()
  })
})

test('should able to persist and retrieve notification setting', async ({ page, extensionId }) => {
  await goToNotificationPage(page, extensionId)

  await page.getByTestId('reminder-tab-option').uncheck()
  await page.getByTestId('desktop-notification-option').check()
  await page.getByTestId('sound-option').uncheck()

  await page.getByTestId('notification-save-button').click()

  await page.reload()

  await expect(page.getByTestId('reminder-tab-option')).not.toBeChecked()
  await expect(page.getByTestId('desktop-notification-option')).toBeChecked()
  await expect(page.getByTestId('sound-option')).not.toBeChecked()
})

test('should able to persist and retrieve setting of blocking timer integration', async ({
  page,
  extensionId
}) => {
  await goToBlockingSettingPage(page, extensionId)

  await page.getByTestId('pause-blocking-during-breaks').uncheck()
  await page.getByTestId('pause-blocking-when-timer-not-running').check()

  await page.getByTestId('save-timer-integration-button').click()

  await page.reload()

  await expect(page.getByTestId('pause-blocking-during-breaks')).not.toBeChecked()
  await expect(page.getByTestId('pause-blocking-when-timer-not-running')).toBeChecked()
})

async function addBlockedDomain(page: Page, domain: string) {
  const input = page.getByTestId('blocked-domain-input')
  const addButton = page.getByTestId('add-domain-button')

  await input.fill(domain)
  await addButton.click()
}

async function removeBlockedDomain(page: Page, domain: string) {
  const removeButton = page.getByTestId(`remove-${domain}`)
  await removeButton.click()
}

async function addNonActiveSchedule(page: Page) {
  let startHours: number
  let endHours: number

  // I can't find a way to mock the time in the test. Clock in playwright doesn't modify the time in service worker.
  // i.e. I choose to compute hours so that current time must not be in the schedule.
  const now = new Date()
  if (now.getHours() >= 21) {
    startHours = 1
    endHours = 2
  } else {
    startHours = now.getHours() + 2
    endHours = now.getHours() + 3
  }

  await page.getByTestId('check-weekday-mon').check()

  await page.getByTestId('start-time-input').fill(`${formatNumber(startHours)}:00`)

  await page.getByTestId('end-time-input').fill(`${formatNumber(endHours)}:00`)

  await page.getByTestId('add-schedule-button').click()
}

const TEXT_IN_BLOCKED_TEMPLATE = 'Stay Focused'

async function assertInBlockedTemplate(page: Page) {
  await expect(page.locator('body')).toContainText(TEXT_IN_BLOCKED_TEMPLATE)
}

async function goToAndVerifyIsBlocked(page: Page, targetUrl: string) {
  return assertWithRetry(async () => {
    await page.goto(targetUrl)
    expect(await page.locator('body').textContent()).toContain(TEXT_IN_BLOCKED_TEMPLATE)
  })
}

async function goToAndVerifyIsAllowed(page: Page, targetUrl: string) {
  return assertWithRetry(async () => {
    await page.goto(targetUrl)
    expect(await page.locator('body').textContent()).not.toContain(TEXT_IN_BLOCKED_TEMPLATE)
  })
}
