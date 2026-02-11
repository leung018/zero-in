import { WeeklySchedulesStorageService } from '@zero-in/shared/domain/schedules/storage'
import { TimerBasedBlockingRulesStorageService } from '@zero-in/shared/domain/timer-based-blocking/storage'
import { FocusSessionRecordsStorageService } from '@zero-in/shared/domain/timer/record/storage'
import { StorageInterface, StorageService } from '@zero-in/shared/infra/storage/interface'
import { SettingsStorageKey } from '@zero-in/shared/infra/storage/key'
import { BrowsingRulesStorageService } from '../../domain/browsing-rules/storage'
import { DailyResetTimeStorageService } from '../../domain/daily-reset-time/storage'
import { NotificationSettingStorageService } from '../../domain/notification-setting/storage'
import { TimerConfigStorageService } from '../../domain/timer/config/storage'
import { TimerStateStorageService } from '../../domain/timer/state/storage'

type StorageServicesMap = {
  [key in SettingsStorageKey]: StorageService<any>
}

export const newSettingStorageServicesMap = (storage: StorageInterface): StorageServicesMap => {
  return {
    [SettingsStorageKey.TimerBasedBlockingRules]: new TimerBasedBlockingRulesStorageService(
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
