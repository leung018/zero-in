import { StorageInterface, StorageService } from './interface'
import { BlockingTimerIntegrationStorageService } from '../../domain/blocking_timer_integration/storage'
import { BrowsingRulesStorageService } from '../../domain/browsing_rules/storage'
import { DailyResetTimeStorageService } from '../../domain/daily_reset_time/storage'
import { NotificationSettingStorageService } from '../../domain/notification_setting/storage'
import { WeeklySchedulesStorageService } from '../../domain/schedules/storage'
import { TimerConfigStorageService } from '../../domain/timer/config/storage'
import { FocusSessionRecordsStorageService } from '../../domain/timer/record/storage'
import { TimerStateStorageService } from '../../domain/timer/state/storage'

/**
 * All storage types that for user settings should be listed here.
 * If users switches from local storage to cloud storage, they can choose to import these settings.
 */
export enum SettingsStorageKey {
  TimerConfig = 'timerConfig',
  WeeklySchedules = 'weeklySchedules',
  FocusSessionRecords = 'focusSessionRecords',
  BrowsingRules = 'browsingRules',
  DailyResetTime = 'dailyCutoffTime',
  NotificationSetting = 'notificationSetting',
  BlockingTimerIntegration = 'blockingTimerIntegration',
  TimerState = 'timerState'
}

export type StorageKey = `${SettingsStorageKey}` | 'featureFlags' | 'importRecord'

type StorageServicesMap = {
  [key in SettingsStorageKey]: StorageService<any>
}

export const newSettingStorageServicesMap = (storage: StorageInterface): StorageServicesMap => {
  return {
    [SettingsStorageKey.BlockingTimerIntegration]: new BlockingTimerIntegrationStorageService(
      storage
    ),
    [SettingsStorageKey.BrowsingRules]: new BrowsingRulesStorageService(storage),
    [SettingsStorageKey.NotificationSetting]: new NotificationSettingStorageService(storage),
    [SettingsStorageKey.WeeklySchedules]: new WeeklySchedulesStorageService(storage),
    [SettingsStorageKey.DailyResetTime]: new DailyResetTimeStorageService(storage),
    [SettingsStorageKey.TimerState]: new TimerStateStorageService(storage),
    [SettingsStorageKey.TimerConfig]: new TimerConfigStorageService(storage),
    [SettingsStorageKey.FocusSessionRecords]: new FocusSessionRecordsStorageService(storage)
  }
}
