import { FakeStorage, type Storage } from '../../../infra/storage'
import type { PomodoroRecord } from '.'
import { ChromeStorageFactory } from '../../../chrome/storage'
import { deserializePomodoroRecord, serializePomodoroRecord } from './serialize'

export class PomodoroRecordStorageService {
  static create() {
    return new PomodoroRecordStorageService(ChromeStorageFactory.createLocalStorage())
  }

  static createFake() {
    return new PomodoroRecordStorageService(new FakeStorage())
  }

  private storage: Storage

  private constructor(storage: Storage) {
    this.storage = storage
  }

  async saveAll(records: PomodoroRecord[]) {
    return this.storage.set({
      focusSessionRecords: records.map(serializePomodoroRecord)
    })
  }

  async getAll(): Promise<PomodoroRecord[]> {
    return this.storage.get('focusSessionRecords').then((result: any) => {
      if (result.focusSessionRecords) {
        return result.focusSessionRecords.map(deserializePomodoroRecord)
      } else {
        return []
      }
    })
  }
}
