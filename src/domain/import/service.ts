import { StorageInterface, StorageService } from '../../infra/storage/interface'
import { SettingsStorageKey } from '../../infra/storage/key'
import { LocalStorageWrapper } from '../../infra/storage/local_storage'
import { BlockingTimerIntegrationStorageService } from '../blocking_timer_integration/storage'
import { BrowsingRulesStorageService } from '../browsing_rules/storage'
import { DailyResetTimeStorageService } from '../daily_reset_time/storage'
import { NotificationSettingStorageService } from '../notification_setting/storage'
import { WeeklySchedulesStorageService } from '../schedules/storage'
import { TimerConfigStorageService } from '../timer/config/storage'
import { FocusSessionRecordsStorageService } from '../timer/record/storage'
import { TimerStateStorageService } from '../timer/state/storage'

type StorageServicesMap = {
  [key in SettingsStorageKey]: StorageService<any>
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
    [SettingsStorageKey.FocusSessionRecords]: new FocusSessionRecordsStorageService(storage)
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
    const importPromises = []

    for (const storageKey of Object.values(SettingsStorageKey)) {
      const remoteStorageService = this.remoteStorageServicesMap[storageKey]
      const localStorageService = this.localStorageServicesMap[storageKey]
      importPromises.push(this.import(localStorageService, remoteStorageService))
    }

    await Promise.all(importPromises)
  }

  private async import<T>(
    sourceStorageService: StorageService<T>,
    targetStorageService: StorageService<T>
  ) {
    const result = await sourceStorageService.get()
    if (result) {
      await targetStorageService.save(result)
    }
  }
}
