import { FakeStorage, StorageWrapper, type Storage } from '../../../infra/storage'
import type { FocusSessionRecord } from '.'
import { ChromeStorageProvider } from '../../../infra/chrome/storage'
import {
  deserializeFocusSessionRecord,
  serializeFocusSessionRecord,
  type SerializedFocusSessionRecord
} from './serialize'

const STORAGE_KEY = 'focusSessionRecords'

export class FocusSessionRecordStorageService {
  static create() {
    return new FocusSessionRecordStorageService(ChromeStorageProvider.getLocalStorage())
  }

  static createFake() {
    return new FocusSessionRecordStorageService(new FakeStorage())
  }

  private storageWrapper: StorageWrapper<SerializedFocusSessionRecord[]>

  private constructor(storage: Storage) {
    this.storageWrapper = new StorageWrapper({
      storage,
      key: STORAGE_KEY,
      migrators: []
    })
  }

  async saveAll(records: FocusSessionRecord[]) {
    return this.storageWrapper.set(records.map(serializeFocusSessionRecord))
  }

  async getAll(): Promise<FocusSessionRecord[]> {
    const result = await this.storageWrapper.get()
    if (result) {
      return result.map(deserializeFocusSessionRecord)
    }
    return []
  }
}
