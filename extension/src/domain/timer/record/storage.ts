import type { FocusSessionRecord } from '.'
import { StorageInterface, StorageService } from '../../../../../shared/src/infra/storage/interface'
import { StorageKey } from '../../../infra/storage/key'
import { StorageManager } from '../../../infra/storage/manager'
import { FocusSessionRecordsSchemas } from './schema'
import { deserializeFocusSessionRecords, serializeFocusSessionRecords } from './serialize'

export class FocusSessionRecordsStorageService implements StorageService<FocusSessionRecord[]> {
  static readonly STORAGE_KEY: StorageKey = 'focusSessionRecords'

  private storageManager: StorageManager<FocusSessionRecordsSchemas[2]>

  constructor(storage: StorageInterface) {
    this.storageManager = StorageManager.create({
      storage,
      key: FocusSessionRecordsStorageService.STORAGE_KEY,
      currentDataVersion: 2,
      migrators: [
        {
          oldDataVersion: undefined,
          migratorFunc: (oldData: FocusSessionRecordsSchemas[0]): FocusSessionRecordsSchemas[1] => {
            return {
              dataVersion: 1,
              completedAts: oldData.map((record) => record.completedAt)
            }
          }
        },
        {
          oldDataVersion: 1,
          migratorFunc: (oldData: FocusSessionRecordsSchemas[1]): FocusSessionRecordsSchemas[2] => {
            return {
              dataVersion: 2,
              records: oldData.completedAts.map((completedAt) => ({
                completedAt: new Date(completedAt).getTime(),
                startedAt: null
              }))
            }
          }
        }
      ]
    })
  }

  async save(records: FocusSessionRecord[]) {
    return this.storageManager.set(serializeFocusSessionRecords(this.deduplicateRecords(records)))
  }

  private deduplicateRecords(records: FocusSessionRecord[]): FocusSessionRecord[] {
    const startedAtSet = new Set()
    const result: FocusSessionRecord[] = []
    for (const record of records) {
      if (record.startedAt && !startedAtSet.has(record.startedAt.getTime())) {
        startedAtSet.add(record.startedAt.getTime())
        result.push(record)
      }
      if (!record.startedAt) {
        result.push(record)
      }
    }
    return result
  }

  async get(): Promise<FocusSessionRecord[]> {
    const result = await this.storageManager.get()
    if (!result) {
      return []
    }
    return deserializeFocusSessionRecords(result)
  }
}
