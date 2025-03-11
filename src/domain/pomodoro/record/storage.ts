import { FakeChromeLocalStorage, type StorageHandler } from '../../../infra/storage'
import type { PomodoroRecord } from '.'
import { ChromeLocalStorageFactory } from '../../../chrome/storage'
import { deserializePomodoroRecord, serializePomodoroRecord } from './serialize'

export class PomodoroRecordStorageService {
  static create() {
    // TODO: Hard to test the real implementation in end to end test until we can set the focus duration much shorter in e2e.
    // Currently, I just manually change the focus duration in config.ts to much shorter and manually test it.
    return new PomodoroRecordStorageService(ChromeLocalStorageFactory.createStorageHandler())
  }

  static createFake() {
    return new PomodoroRecordStorageService(new FakeChromeLocalStorage())
  }

  private storageHandler: StorageHandler

  private constructor(storageHandler: StorageHandler) {
    this.storageHandler = storageHandler
  }

  async add(record: PomodoroRecord) {
    const pomodoroRecords = await this.getAll()
    pomodoroRecords.push(record)
    return this.storageHandler.set({
      pomodoroRecords: pomodoroRecords.map(serializePomodoroRecord)
    })
  }

  async getAll(): Promise<PomodoroRecord[]> {
    return this.storageHandler.get('pomodoroRecords').then((result: any) => {
      if (result.pomodoroRecords) {
        return result.pomodoroRecords.map(deserializePomodoroRecord)
      } else {
        return []
      }
    })
  }

  async getRecordsOnOrAfter(date: Date): Promise<PomodoroRecord[]> {
    return this.getAll().then((records) => {
      return records.filter((record) => record.completedAt >= date)
    })
  }
}
