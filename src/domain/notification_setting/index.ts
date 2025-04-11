export type NotificationSetting = {
  reminderTab: boolean
  desktopNotification: boolean
  sound: boolean
}

export function newTestNotificationSetting(
  overrides: Partial<NotificationSetting> = {}
): NotificationSetting {
  return {
    reminderTab: true,
    desktopNotification: true,
    sound: true,
    ...overrides
  }
}
