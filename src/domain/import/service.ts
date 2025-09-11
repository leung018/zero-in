import { StorageInterface } from '../../infra/storage/interface'
import { SettingsStorageKey } from '../../infra/storage/key'
import { BlockingTimerIntegrationStorageService } from '../blocking_timer_integration/storage'
import { BrowsingRulesStorageService } from '../browsing_rules/storage'
import { DailyResetTimeStorageService } from '../daily_reset_time/storage'
import { NotificationSettingStorageService } from '../notification_setting/storage'
import { WeeklySchedulesStorageService } from '../schedules/storage'
import { TimerConfigStorageService } from '../timer/config/storage'
import { FocusSessionRecordStorageService } from '../timer/record/storage'
import { TimerStateStorageService } from '../timer/state/storage'

type StorageServicesMap = {
  [key in SettingsStorageKey]: any
}

const newStorageServicesMap = (storage: StorageInterface): StorageServicesMap => {
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
    [SettingsStorageKey.FocusSessionRecords]: new FocusSessionRecordStorageService(storage)
  }
}

export class ImportService {
  private localStorageServicesMap: StorageServicesMap
  private remoteStorageServicesMap: StorageServicesMap

  constructor({
    localStorage,
    remoteStorage
  }: {
    localStorage: StorageInterface
    remoteStorage: StorageInterface
  }) {
    this.localStorageServicesMap = newStorageServicesMap(localStorage)
    this.remoteStorageServicesMap = newStorageServicesMap(remoteStorage)
  }
}
