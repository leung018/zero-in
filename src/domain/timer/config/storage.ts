import type { TimerConfig } from '.'
import config from '../../../config'
import { FakeObservableStorage } from '../../../infra/storage/fake'
import { ObservableStorage, StorageInterface } from '../../../infra/storage/interface'
import { LocalStorageWrapper } from '../../../infra/storage/local_storage'
import { StorageManager } from '../../../infra/storage/manager'
import { AdaptiveStorageProvider } from '../../../infra/storage/provider'
import {
  deserializeTimerConfig,
  serializeTimerConfig,
  type SerializedTimerConfig
} from './serialize'

export class TimerConfigStorageService {
  static readonly STORAGE_KEY = 'timerConfig'

  static create() {
    return new TimerConfigStorageService(AdaptiveStorageProvider.create())
  }

  static createFake() {
    return new TimerConfigStorageService(LocalStorageWrapper.createFake())
  }

  static createObservableFake() {
    return new TimerConfigStorageService(FakeObservableStorage.create())
  }

  private storageManager: StorageManager<SerializedTimerConfig>

  private unsubscribes: (() => void)[] = []

  constructor(storage: ObservableStorage | StorageInterface) {
    this.storageManager = new StorageManager({
      storage,
      key: TimerConfigStorageService.STORAGE_KEY,
      migrators: []
    })
  }

  async get(): Promise<TimerConfig> {
    const result = await this.storageManager.get()
    if (result) {
      return deserializeTimerConfig(result)
    }

    return config.getDefaultTimerConfig()
  }

  async save(timerConfig: TimerConfig) {
    return this.storageManager.set(serializeTimerConfig(timerConfig))
  }

  async onChange(callback: (config: TimerConfig) => void) {
    const unsubscribe = await this.storageManager.onChange((data) => {
      callback(deserializeTimerConfig(data))
    })
    this.unsubscribes.push(unsubscribe)
  }

  unsubscribeAll() {
    this.unsubscribes.forEach((unsubscribe) => unsubscribe())
    this.unsubscribes = []
  }
}
