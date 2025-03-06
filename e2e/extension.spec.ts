/* eslint-disable playwright/expect-expect */
import { Page } from '@playwright/test'
import { test, expect } from './fixtures.js'

test.describe.configure({ mode: 'parallel' })

test('should able to persist blocked domains and update ui', async ({ page, extensionId }) => {
  await goToBlockedDomainsPage(page, extensionId)

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

test('should able to add blocked domains and block them', async ({ page, extensionId }) => {
  const extraPage = await page.context().newPage()
  for (const p of [page, extraPage]) {
    await p.route('https://google.com', async (route) => {
      await route.fulfill({ body: 'This is fake google.com' })
    })
  }
  await extraPage.goto('https://google.com')
  await expect(extraPage.locator('body')).toContainText('This is fake google.com')

  // Add blocked Domain
  await goToBlockedDomainsPage(page, extensionId)
  await addBlockedDomain(page, 'google.com')

  // Previous page which is in google.com should be blocked
  await assertInBlockedTemplate(extraPage)

  // Future request to google.com should be blocked
  await assertGoToBlockedTemplate(extraPage, 'https://google.com')
})

test('should able to remove all blocked domains and unblock them', async ({
  page,
  extensionId
}) => {
  await goToBlockedDomainsPage(page, extensionId)

  await addBlockedDomain(page, 'google.com')
  await removeBlockedDomain(page, 'google.com')

  await page.route('https://google.com', async (route) => {
    await route.fulfill({ body: 'This is fake google.com' })
  })
  await assertNotGoToBlockedTemplate(page, 'https://google.com')
})

test('should able to persist blocked schedules and update ui', async ({ page, extensionId }) => {
  await goToSchedulesPage(page, extensionId)

  // Add a schedule
  await page.getByTestId('check-weekday-sun').check()

  await page.getByTestId('start-time-hour-input').fill('10')
  await page.getByTestId('start-time-minute-input').fill('00')

  await page.getByTestId('end-time-hour-input').fill('12')
  await page.getByTestId('end-time-minute-input').fill('00')

  await page.getByTestId('add-button').click()

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

  // Remove the schedule
  await page.getByTestId('remove-schedule-with-index-0').click()
  await expect(page.getByTestId('weekly-schedule')).toHaveCount(0)

  // Reload to check if the schedule is removed
  await page.reload()
  await expect(page.getByTestId('weekly-schedule')).toHaveCount(0)
})

test('should able to disable blocking according to schedule', async ({ page, extensionId }) => {
  await goToBlockedDomainsPage(page, extensionId)

  await addBlockedDomain(page, 'google.com')

  await page.route('https://google.com', async (route) => {
    await route.fulfill({ body: 'This is fake google.com' })
  })

  let startHours: number
  let endHours: number
  // FIXME: I can't find a way to mock the time in the test. Clock in playwright doesn't modify the time in service worker.
  // i.e. I choose to compute hours so that current time must not be in the schedule.
  const now = new Date()
  // eslint-disable-next-line playwright/no-conditional-in-test
  if (now.getHours() >= 21) {
    startHours = 1
    endHours = 2
  } else {
    startHours = now.getHours() + 2
    endHours = now.getHours() + 3
  }

  await goToSchedulesPage(page, extensionId)

  await page.getByTestId('check-weekday-mon').check()

  await page.getByTestId('start-time-hour-input').fill(startHours.toString())
  await page.getByTestId('start-time-minute-input').fill('00')

  await page.getByTestId('end-time-hour-input').fill(endHours.toString())
  await page.getByTestId('end-time-minute-input').fill('00')

  await page.getByTestId('add-button').click()

  await assertNotGoToBlockedTemplate(page, 'https://google.com')
})

test('should pomodoro timer count successfully', async ({ page, extensionId }) => {
  await goToPomodoroTimer(page, extensionId)

  await expect(page.getByTestId('timer-display')).toContainText('25:00')

  await page.getByTestId('start-button').click()

  await expect(page.getByTestId('timer-display')).toContainText('24:59')

  // FIXME: Below test catch the bug related to subscription of timer state from service worker. Better catch the bug in unit test instead.
  await page.getByTestId('pause-button').click()
  await page.reload()
  await page.getByTestId('start-button').click()

  await expect(page.getByTestId('timer-display')).toContainText('24:57')
})

test('should close reminder page after clicking start button', async ({ page, extensionId }) => {
  await goToReminderPage(page, extensionId)

  await page.getByTestId('start-button').click()

  expect(page.context().pages()).not.toContain(page)
})

async function goToBlockedDomainsPage(page: Page, extensionId: string) {
  await page.goto(`chrome-extension://${extensionId}/options.html#/blocked-domains`)
}

async function addBlockedDomain(page: Page, domain: string) {
  const input = page.getByTestId('blocked-domain-input')
  const addButton = page.getByTestId('add-button')

  await input.fill(domain)
  await addButton.click()
}

async function removeBlockedDomain(page: Page, domain: string) {
  const removeButton = page.getByTestId(`remove-${domain}`)
  await removeButton.click()
}

const TEXT_IN_BLOCKED_TEMPLATE = 'Stay Focused'

async function assertInBlockedTemplate(page: Page) {
  await expect(page.locator('body')).toContainText(TEXT_IN_BLOCKED_TEMPLATE)
}

async function assertGoToBlockedTemplate(
  page: Page,
  targetUrl: string,
  retryCount = 3,
  intervalMs = 100
) {
  await page.goto(targetUrl)
  try {
    expect(await page.locator('body').textContent()).toContain(TEXT_IN_BLOCKED_TEMPLATE)
  } catch (Exception) {
    if (retryCount <= 0) {
      throw Exception
    }
    await sleep(intervalMs)
    return assertGoToBlockedTemplate(page, targetUrl, retryCount - 1, intervalMs)
  }
}

async function assertNotGoToBlockedTemplate(
  page: Page,
  targetUrl: string,
  retryCount = 3,
  intervalMs = 100
) {
  await page.goto(targetUrl)
  try {
    expect(await page.locator('body').textContent()).not.toContain(TEXT_IN_BLOCKED_TEMPLATE)
  } catch (Exception) {
    if (retryCount <= 0) {
      throw Exception
    }
    await sleep(intervalMs)
    return assertNotGoToBlockedTemplate(page, targetUrl, retryCount - 1, intervalMs)
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function goToSchedulesPage(page: Page, extensionId: string) {
  await page.goto(`chrome-extension://${extensionId}/options.html#/schedules`)
}

async function goToPomodoroTimer(page: Page, extensionId: string) {
  await page.goto(`chrome-extension://${extensionId}/popup.html`)
}

async function goToReminderPage(page: Page, extensionId: string) {
  await page.goto(`chrome-extension://${extensionId}/reminder.html`)
}
