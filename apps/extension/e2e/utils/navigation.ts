import { Page } from '@playwright/test'

export async function goToBlockingSettingPage(page: Page, extensionId: string) {
  await page.goto(`chrome-extension://${extensionId}/options.html`)
}

export async function goToFocusTimer(page: Page, extensionId: string) {
  await page.goto(`chrome-extension://${extensionId}/popup.html`)
}

export async function goToReminderPage(page: Page, extensionId: string) {
  await page.goto(`chrome-extension://${extensionId}/reminder.html`)
}

export async function goToStatisticsPage(page: Page, extensionId: string) {
  await page.goto(`chrome-extension://${extensionId}/options.html#/statistics`)
}

export async function goToTestingConfigPage(page: Page, extensionId: string) {
  await page.goto(`chrome-extension://${extensionId}/testing-config.html`)
}

export async function goToNotificationPage(page: Page, extensionId: string) {
  await page.goto(`chrome-extension://${extensionId}/options.html#/notification`)
}
