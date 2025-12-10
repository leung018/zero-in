import { StorageInterface, StorageService } from '@zero-in/shared/infra/storage/interface'
import { StorageKey } from '@zero-in/shared/infra/storage/key'
import { LocalStorageWrapper } from '@zero-in/shared/infra/storage/local-storage/index'
import { StorageManager } from '@zero-in/shared/infra/storage/manager'
import { BrowsingRules } from '.'
import { AdaptiveStorageProvider } from '../../infra/storage/adaptive'
import {
  deserializeBrowsingRules,
  serializeBrowsingRules,
  type SerializedBrowsingRules
} from './serialize'

export class BrowsingRulesStorageService implements StorageService<BrowsingRules> {
  static readonly STORAGE_KEY: StorageKey = 'browsingRules'

  static createFake(): BrowsingRulesStorageService {
    return new BrowsingRulesStorageService(LocalStorageWrapper.createFake())
  }

  static create(): BrowsingRulesStorageService {
    return new BrowsingRulesStorageService(AdaptiveStorageProvider.create())
  }

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
