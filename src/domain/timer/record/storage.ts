import type { FocusSessionRecord } from '.'
import { BrowserStorageProvider } from '../../../infra/browser/storage'
import { FakeStorage, StorageManager, type Storage } from '../../../infra/storage'
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
    return new FocusSessionRecordStorageService(new FakeStorage())
  }

  private storageManager: StorageManager<SerializedFocusSessionRecord[]>

  private constructor(storage: Storage) {
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
