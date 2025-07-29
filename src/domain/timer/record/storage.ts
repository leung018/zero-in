import type { FocusSessionRecord } from '.'
import { StorageInterface } from '../../../infra/storage/interface'
import { LocalStorageWrapper } from '../../../infra/storage/local_storage_wrapper'
import { StorageManager } from '../../../infra/storage/manager'
import { AdaptiveStorageProvider } from '../../../infra/storage/provider'
import { FocusSessionRecordsSchemas } from './schema'
import { deserializeFocusSessionRecords, serializeFocusSessionRecords } from './serialize'

export class FocusSessionRecordStorageService {
  static readonly STORAGE_KEY = 'focusSessionRecords'

  static create() {
    return new FocusSessionRecordStorageService(AdaptiveStorageProvider.create())
  }

  static createFake() {
    return new FocusSessionRecordStorageService(LocalStorageWrapper.createFake())
  }

  private storageManager: StorageManager<FocusSessionRecordsSchemas[1]>

  constructor(storage: StorageInterface) {
    this.storageManager = new StorageManager({
      storage,
      key: FocusSessionRecordStorageService.STORAGE_KEY,
      currentDataVersion: 1,
      migrators: [
        {
          oldDataVersion: undefined,
          migratorFunc: (oldData: FocusSessionRecordsSchemas[0]): FocusSessionRecordsSchemas[1] => {
            return {
              dataVersion: 1,
              completedAts: oldData.map((record) => record.completedAt)
            }
          }
        }
      ]
    })
  }

  async saveAll(records: FocusSessionRecord[]) {
    return this.storageManager.set(serializeFocusSessionRecords(records))
  }

  async getAll(): Promise<FocusSessionRecord[]> {
    const result = await this.storageManager.get()
    if (!result) {
      return []
    }
    return deserializeFocusSessionRecords(result)
  }
}
