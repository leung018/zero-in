import { StorageInterface } from '../../../infra/storage/interface'
import { StorageKey } from '../../../infra/storage/key'
import { LocalStorageWrapper } from '../../../infra/storage/local_storage'
import { StorageManager } from '../../../infra/storage/manager'
import { AdaptiveStorageProvider } from '../../../infra/storage/provider'
import { ImportRecord, newEmptyImportRecord } from './index'

export class ImportRecordStorageService {
  static readonly STORAGE_KEY: StorageKey = 'importRecord'

  static create(): ImportRecordStorageService {
    return new ImportRecordStorageService(AdaptiveStorageProvider.create())
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
