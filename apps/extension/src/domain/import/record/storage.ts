import { StorageInterface } from '@zero-in/shared/infra/storage/interface'
import { StorageKey } from '@zero-in/shared/infra/storage/key'
import { LocalStorageWrapper } from '@zero-in/shared/infra/storage/local-storage/index'
import { StorageManager } from '@zero-in/shared/infra/storage/manager'
import { FirestoreStorageWrapper } from '../../../infra/storage/firestore'
import { ImportRecord, newEmptyImportRecord } from './index'

export class ImportRecordStorageService {
  static readonly STORAGE_KEY: StorageKey = 'importRecord'

  static create(): ImportRecordStorageService {
    return new ImportRecordStorageService(FirestoreStorageWrapper.create())
  }

  static createFake(): ImportRecordStorageService {
    return new ImportRecordStorageService(LocalStorageWrapper.createFake())
  }

  private storageManager: StorageManager<ImportRecord>

  private constructor(storage: StorageInterface) {
    this.storageManager = StorageManager.create({
      storage,
      key: ImportRecordStorageService.STORAGE_KEY,
      migrators: []
    })
  }

  async get(): Promise<ImportRecord> {
    const result = await this.storageManager.get()
    if (result == null) {
      return newEmptyImportRecord()
    }
    return result
  }

  async save(record: ImportRecord): Promise<void> {
    return this.storageManager.set(record)
  }
}
