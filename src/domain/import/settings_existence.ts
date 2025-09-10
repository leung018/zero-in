import { StorageInterface } from '../../infra/storage/interface'
import { LocalStorageWrapper } from '../../infra/storage/local_storage'
import { BlockingTimerIntegrationStorageService } from '../blocking_timer_integration/storage'
import { BrowsingRulesStorageService } from '../browsing_rules/storage'
import { WeeklyScheduleStorageService } from '../schedules/storage'
import { TimerConfigStorageService } from '../timer/config/storage'
import { FocusSessionRecordStorageService } from '../timer/record/storage'

export class SettingsExistenceService {
  static INTERESTED_STORAGE_KEYS = [
    BlockingTimerIntegrationStorageService.STORAGE_KEY,
    TimerConfigStorageService.STORAGE_KEY,
    WeeklyScheduleStorageService.STORAGE_KEY,
    FocusSessionRecordStorageService.STORAGE_KEY,
    BrowsingRulesStorageService.STORAGE_KEY
  ]

  private storage: StorageInterface
  private interestedStorageKeys: string[]

  static createFake({
    storage = LocalStorageWrapper.createFake(),
    interestedStorageKeys = SettingsExistenceService.INTERESTED_STORAGE_KEYS
  } = {}) {
    return new SettingsExistenceService({
      storage,
      interestedStorageKeys
    })
  }

  constructor({
    storage,
    interestedStorageKeys
  }: {
    storage: StorageInterface
    interestedStorageKeys: string[]
  }) {
    this.storage = storage
    this.interestedStorageKeys = interestedStorageKeys
  }

  async hasSettings(): Promise<boolean> {
    for (const key of this.interestedStorageKeys) {
      const data = await this.storage.get(key)
      if (data !== undefined) {
        return true
      }
    }
    return false
  }
}
