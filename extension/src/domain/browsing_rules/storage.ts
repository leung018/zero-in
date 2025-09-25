import { BrowsingRules } from '.'
import { StorageInterface, StorageService } from '../../../../shared/src/infra/storage/interface'
import { StorageKey } from '../../infra/storage/key'
import { StorageManager } from '../../infra/storage/manager'
import {
  deserializeBrowsingRules,
  serializeBrowsingRules,
  type SerializedBrowsingRules
} from './serialize'

export class BrowsingRulesStorageService implements StorageService<BrowsingRules> {
  static readonly STORAGE_KEY: StorageKey = 'browsingRules'

  private storageManager: StorageManager<SerializedBrowsingRules>

  constructor(storage: StorageInterface) {
    this.storageManager = StorageManager.create({
      storage,
      key: BrowsingRulesStorageService.STORAGE_KEY,
      migrators: []
    })
  }

  async save(browsingRules: BrowsingRules): Promise<void> {
    return this.storageManager.set(serializeBrowsingRules(browsingRules))
  }

  async get(): Promise<BrowsingRules> {
    const result = await this.storageManager.get()
    if (result) {
      return deserializeBrowsingRules(result)
    }
    return new BrowsingRules()
  }
}
