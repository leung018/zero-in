import { FakeStorage, type Storage } from '../../../infra/storage'
import type { FocusSessionRecord } from '.'
import { ChromeStorageProvider } from '../../../chrome/storage'
import { deserializeFocusSessionRecord, serializeFocusSessionRecord } from './serialize'

const STORAGE_KEY = 'focusSessionRecords'

export class FocusSessionRecordStorageService {
  static create() {
    return new FocusSessionRecordStorageService(ChromeStorageProvider.getLocalStorage())
  }

  static createFake() {
    return new FocusSessionRecordStorageService(new FakeStorage())
  }

  private storage: Storage

  private constructor(storage: Storage) {
    this.storage = storage
  }

  async saveAll(records: FocusSessionRecord[]) {
    return this.storage.set({
      [STORAGE_KEY]: records.map(serializeFocusSessionRecord)
    })
  }

  async getAll(): Promise<FocusSessionRecord[]> {
    const result = await this.storage.get(STORAGE_KEY)
    if (result[STORAGE_KEY]) {
      return result[STORAGE_KEY].map(deserializeFocusSessionRecord)
    }
    return []
  }
}
