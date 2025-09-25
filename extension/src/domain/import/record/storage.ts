import { StorageInterface } from '../../../../../shared/src/infra/storage/interface'
import { StorageKey } from '../../../infra/storage/key'
import { StorageManager } from '../../../infra/storage/manager'
import { ImportRecord, newEmptyImportRecord } from './index'

export class ImportRecordStorageService {
  static readonly STORAGE_KEY: StorageKey = 'importRecord'

  private storageManager: StorageManager<ImportRecord>

  constructor(storage: StorageInterface) {
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
