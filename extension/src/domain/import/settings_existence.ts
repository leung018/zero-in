import { StorageInterface } from '../../infra/storage/interface'
import { SettingsStorageKey } from '../../infra/storage/key'
import { LocalStorageWrapper } from '../../infra/storage/local_storage'

/**
 * Service to check if user has set any settings in storage.
 * Application will depends on this service to decide to whether to show the import settings dialog or not.
 */
export class SettingsExistenceService {
  /*
   * Note: For why I exclude TimerState from the interested storage keys, because it may be set automatically in listener.reload
   * Even user do not explicitly save it.
   */
  static readonly INTERESTED_STORAGE_KEYS = Object.values(SettingsStorageKey).filter(
    (key) => key !== SettingsStorageKey.TimerState
  )

  private storage: StorageInterface
  private interestedStorageKeys: string[]

  static create(storage: StorageInterface) {
    return new SettingsExistenceService({
      storage,
      interestedStorageKeys: SettingsExistenceService.INTERESTED_STORAGE_KEYS
    })
  }

  static createFake({
    storage = LocalStorageWrapper.createFake(),
    interestedStorageKeys = Object.values(SettingsStorageKey) as string[]
  } = {}) {
    return new SettingsExistenceService({
      storage,
      interestedStorageKeys
    })
  }

  private constructor({
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
