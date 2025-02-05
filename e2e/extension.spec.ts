/* eslint-disable playwright/expect-expect */
import { Page } from '@playwright/test'
import { test, expect } from './fixtures.js'

test.describe.configure({ mode: 'parallel' })

test('should able to persist blocked domains and fetching them', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/popup.html`)

  await addBlockedDomain(page, 'abc.com')
  await addBlockedDomain(page, 'xyz.com')

  await page.reload()

  const domainsAfterReload = page.getByTestId('blocked-domain')
  await expect(domainsAfterReload).toHaveCount(2)
  await expect(domainsAfterReload.nth(0)).toHaveText('abc.com')
  await expect(domainsAfterReload.nth(1)).toHaveText('xyz.com')
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
  await page.goto(`chrome-extension://${extensionId}/popup.html`)
  await addBlockedDomain(page, 'google.com')

  // Previous page which is in google.com should be blocked
  await assertInBlockedTemplate(extraPage)

  // Future request to google.com should be blocked
  await page.goto('https://google.com')
  await assertInBlockedTemplate(page)
})

test('should able to remove all blocked domains and unblock them', async ({
  page,
  extensionId
}) => {
  await page.goto(`chrome-extension://${extensionId}/popup.html`)

  await addBlockedDomain(page, 'google.com')
  await removeBlockedDomain(page, 'google.com')

  await page.route('https://google.com', async (route) => {
    await route.fulfill({ body: 'This is fake google.com' })
  })
  await page.goto('https://google.com')
  await assertNotInBlockedTemplate(page)
})

test('should able to persist blocked schedules and fetching them', async ({
  page,
  extensionId
}) => {
  await page.goto(`chrome-extension://${extensionId}/options.html`)

  await page.getByTestId('check-weekday-Sun').check()

  await page.getByTestId('start-time-hour-input').fill('10')
  await page.getByTestId('start-time-minute-input').fill('00')

  await page.getByTestId('end-time-hour-input').fill('12')
  await page.getByTestId('end-time-minute-input').fill('00')

  await page.getByTestId('add-button').click()

  await page.reload()

  const schedules = page.getByTestId('weekly-schedule')
  await expect(schedules).toHaveCount(1)
  await expect(schedules.nth(0)).toContainText('Sun')
  await expect(schedules.nth(0)).toContainText('10:00 - 12:00')
})

test('should able to disable block according to schedule', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/popup.html`)

  await addBlockedDomain(page, 'google.com')

  await page.route('https://google.com', async (route) => {
    await route.fulfill({ body: 'This is fake google.com' })
  })

  let startHours: number
  let endHours: number
  // FIXME: I can't find a way to mock the time in the test. Clock in playwright doesn't modify the time in service worker.
  // i.e. I choose to compute hours so that current time must not be in the schedule.
  // eslint-disable-next-line playwright/no-conditional-in-test
  if (new Date().getHours() >= 21) {
    startHours = 1
    endHours = 2
  } else {
    startHours = new Date().getHours() + 2
    endHours = new Date().getHours() + 3
  }

  await page.goto(`chrome-extension://${extensionId}/options.html`)

  await page.getByTestId('check-weekday-Mon').check()

  await page.getByTestId('start-time-hour-input').fill(startHours.toString())
  await page.getByTestId('start-time-minute-input').fill('00')

  await page.getByTestId('end-time-hour-input').fill(endHours.toString())
  await page.getByTestId('end-time-minute-input').fill('00')

  await page.getByTestId('add-button').click()

  await fireChromeAlarm(page, 'redirectRules')
  await sleep(100) // FIXME: No explicit way to wait the alarm listener finish its job. So do this hack here.

  await page.goto('https://google.com')
  await assertNotInBlockedTemplate(page)
})

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

async function assertNotInBlockedTemplate(page: Page) {
  await expect(page.locator('body')).not.toContainText(TEXT_IN_BLOCKED_TEMPLATE)
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

// Using clock api cannot control the chrome.alarms, so I use this function to fire the alarm.
async function fireChromeAlarm(page: Page, alarmName: string) {
  await page.evaluate(
    async ([alarmName]) => {
      await chrome.alarms.create(alarmName, {
        when: Date.now()
      })
    },
    [alarmName]
  )
}
