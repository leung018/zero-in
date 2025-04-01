import { FakeStorage, type Storage } from '../../../infra/storage'
import type { PomodoroRecord } from '.'
import { ChromeStorageFactory } from '../../../chrome/storage'
import { deserializePomodoroRecord, serializePomodoroRecord } from './serialize'

const STORAGE_KEY = 'focusSessionRecords'

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
      [STORAGE_KEY]: records.map(serializePomodoroRecord)
    })
  }

  async getAll(): Promise<PomodoroRecord[]> {
    return this.storage.get(STORAGE_KEY).then((result: any) => {
      if (result[STORAGE_KEY]) {
        return result[STORAGE_KEY].map(deserializePomodoroRecord)
      } else {
        return []
      }
    })
  }
}
