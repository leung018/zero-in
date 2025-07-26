import type { FocusSessionRecord } from '.'
import { StorageInterface } from '../../../infra/storage/interface'
import { LocalStorageWrapper } from '../../../infra/storage/local_storage_wrapper'
import { StorageManager } from '../../../infra/storage/manager'
import {
  deserializeFocusSessionRecord,
  serializeFocusSessionRecord,
  type SerializedFocusSessionRecord
} from './serialize'

export class FocusSessionRecordStorageService {
  static readonly STORAGE_KEY = 'focusSessionRecords'

  static create() {
    return new FocusSessionRecordStorageService(LocalStorageWrapper.create())
  }

  static createFake() {
    return new FocusSessionRecordStorageService(LocalStorageWrapper.createFake())
  }

  private storageManager: StorageManager<SerializedFocusSessionRecord[]>

  constructor(storage: StorageInterface) {
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
