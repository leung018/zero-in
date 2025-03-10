import { FakeChromeLocalStorage, type StorageHandler } from '../../../infra/storage'
import type { PomodoroRecord } from '.'
import { ChromeLocalStorageFactory } from '../../../chrome/storage'
import { deserializePomodoroRecord, serializePomodoroRecord } from './serialize'

export class PomodoroRecordStorageService {
  static create() {
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
