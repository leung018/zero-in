import { BrowsingRules } from '.'
import { StorageInterface } from '../../infra/storage/interface'
import { LocalStorageWrapper } from '../../infra/storage/local_storage_wrapper'
import { StorageManager } from '../../infra/storage/manager'
import { AdaptiveStorageProvider } from '../../infra/storage/provider'
import {
  deserializeBrowsingRules,
  serializeBrowsingRules,
  type SerializedBrowsingRules
} from './serialize'

export class BrowsingRulesStorageService {
  static readonly STORAGE_KEY = 'browsingRules'

  static createFake(): BrowsingRulesStorageService {
    return new BrowsingRulesStorageService(LocalStorageWrapper.createFake())
  }

  static create(): BrowsingRulesStorageService {
    return new BrowsingRulesStorageService(AdaptiveStorageProvider.create())
  }

  private storageManager: StorageManager<SerializedBrowsingRules>

  constructor(storage: StorageInterface) {
    this.storageManager = new StorageManager({
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
