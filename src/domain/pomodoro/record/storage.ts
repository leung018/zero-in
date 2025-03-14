import { FakeStorage, type Storage } from '../../../infra/storage'
import type { PomodoroRecord } from '.'
import { ChromeStorageFactory } from '../../../chrome/storage'
import { deserializePomodoroRecord, serializePomodoroRecord } from './serialize'

export class PomodoroRecordStorageService {
  static create() {
    // TODO: Hard to test the real implementation in end to end test until we can set the focus duration much shorter in e2e.
    // Currently, I just manually change the focus duration in config.ts to much shorter and manually test it.
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
      pomodoroRecords: records.map(serializePomodoroRecord)
    })
  }

  async getAll(): Promise<PomodoroRecord[]> {
    return this.storage.get('pomodoroRecords').then((result: any) => {
      if (result.pomodoroRecords) {
        return result.pomodoroRecords.map(deserializePomodoroRecord)
      } else {
        return []
      }
    })
  }
}
