import { FakeLocalStorage, type LocalStorage } from '@/infra/storage/local_storage'
import type { FocusSessionRecord } from '.'
import { BrowserStorageProvider } from '../../../infra/browser/storage'
import { StorageManager } from '../../../infra/storage/manager'
import {
  deserializeFocusSessionRecord,
  serializeFocusSessionRecord,
  type SerializedFocusSessionRecord
} from './serialize'

export class FocusSessionRecordStorageService {
  static readonly STORAGE_KEY = 'focusSessionRecords'

  static create() {
    return new FocusSessionRecordStorageService(BrowserStorageProvider.getLocalStorage())
  }

  static createFake() {
    return new FocusSessionRecordStorageService(new FakeLocalStorage())
  }

  private storageManager: StorageManager<SerializedFocusSessionRecord[]>

  private constructor(storage: LocalStorage) {
    this.storageManager = new StorageManager({
      storage,
      key: FocusSessionRecordStorageService.STORAGE_KEY,
      migrators: []
    })
  }

  async saveAll(records: FocusSessionRecord[]) {
    return this.storageManager.set(records.map(serializeFocusSessionRecord))
  }

  async getAll(): Promise<FocusSessionRecord[]> {
    const result = await this.storageManager.get()
    if (result) {
      return result.map(deserializeFocusSessionRecord)
    }
    return []
  }
}
