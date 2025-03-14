import { ChromeStorageFactory } from '../../chrome/storage'
import { FakeStorage, type Storage } from '../../infra/storage'
import { Time } from '../time'
import { deserializeTime, serializeTime } from '../time/serialize'

export class DailyCutoffTimeStorageService {
  static create() {
    return new DailyCutoffTimeStorageService(ChromeStorageFactory.createLocalStorage())
  }

  static createFake() {
    return new DailyCutoffTimeStorageService(new FakeStorage())
  }

  private storage: Storage

  private constructor(storage: Storage) {
    this.storage = storage
  }

  async save(dailyCutoffTime: Time) {
    return this.storage.set({
      dailyCutoffTime: serializeTime(dailyCutoffTime)
    })
  }

  async get(): Promise<Time> {
    return this.storage.get('dailyCutoffTime').then((result) => {
      if (result.dailyCutoffTime) {
        return deserializeTime(result.dailyCutoffTime)
      }

      return new Time(0, 0)
    })
  }
}
