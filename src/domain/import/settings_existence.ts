import { StorageInterface } from '../../infra/storage/interface'
import { SettingsStorageKey } from '../../infra/storage/key'
import { LocalStorageWrapper } from '../../infra/storage/local_storage'
export class SettingsExistenceService {
  private storage: StorageInterface
  private interestedStorageKeys: string[]

  static create(storage: StorageInterface) {
    return new SettingsExistenceService({
      storage,
      interestedStorageKeys: Object.values(SettingsStorageKey)
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
