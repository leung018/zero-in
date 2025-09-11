/**
 * All storage types that for user settings should be listed here.
 * If users switches from local storage to cloud storage, they can choose to import these settings.
 */
export enum SettingsStorageKey {
  TimerConfig = 'timerConfig',
  WeeklySchedules = 'weeklySchedules',
  FocusSessionRecords = 'focusSessionRecords',
  BrowsingRules = 'browsingRules',
  DailyCutoffTime = 'dailyCutoffTime',
  NotificationSetting = 'notificationSetting',
  BlockingTimerIntegration = 'blockingTimerIntegration',
  TimerState = 'timerState'
}

export type StorageKey = `${SettingsStorageKey}` | 'featureFlags' | 'importRecord'
