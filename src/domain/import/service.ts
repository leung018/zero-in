import { StorageInterface } from '../../infra/storage/interface'
import { SettingsStorageKey } from '../../infra/storage/key'
import { LocalStorageWrapper } from '../../infra/storage/local_storage'
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

  static createFake({
    localStorage = LocalStorageWrapper.createFake(),
    remoteStorage = LocalStorageWrapper.createFake()
  }) {
    return new ImportService({
      localStorage,
      remoteStorage
    })
  }

  private constructor({
    localStorage,
    remoteStorage
  }: {
    localStorage: StorageInterface
    remoteStorage: StorageInterface
  }) {
    this.localStorageServicesMap = newStorageServicesMap(localStorage)
    this.remoteStorageServicesMap = newStorageServicesMap(remoteStorage)
  }

  async importFromLocalToRemote() {
    // TODO: support other storageServices

    const remoteNotificationSettingStorageService =
      this.remoteStorageServicesMap[SettingsStorageKey.NotificationSetting]

    const localNotificationSettingStorageService =
      this.localStorageServicesMap[SettingsStorageKey.NotificationSetting]

    await remoteNotificationSettingStorageService.save(
      await localNotificationSettingStorageService.get()
    )
  }
}
