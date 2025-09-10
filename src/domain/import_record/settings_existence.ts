import { StorageInterface } from '../../infra/storage/interface'
import { BlockingTimerIntegrationStorageService } from '../blocking_timer_integration/storage'

export class SettingsExistenceService {
  private storage: StorageInterface

  constructor(storage: StorageInterface) {
    this.storage = storage
  }

  async hasSettings(): Promise<boolean> {
    const data = await this.storage.get(BlockingTimerIntegrationStorageService.STORAGE_KEY) // TODO: check other storage_key
    return data !== undefined
  }
}
