import { FakeChromeLocalStorage, type StorageHandler } from '../../../infra/storage'
import type { PomodoroRecord } from '.'

export class PomodoroRecordStorageService {
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
      pomodoroRecords
    })
  }

  async getAll(): Promise<PomodoroRecord[]> {
    return this.storageHandler.get('pomodoroRecords').then((result: any) => {
      if (result.pomodoroRecords) {
        return result.pomodoroRecords
      } else {
        return []
      }
    })
  }
}
