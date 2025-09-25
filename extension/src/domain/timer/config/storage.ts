import type { TimerConfig } from '.'
import {
  ObservableStorage,
  StorageInterface,
  StorageService
} from '../../../../../shared/src/infra/storage/interface'
import config from '../../../config'
import { StorageKey } from '../../../infra/storage/key'
import { StorageManager } from '../../../infra/storage/manager'
import {
  deserializeTimerConfig,
  serializeTimerConfig,
  type SerializedTimerConfig
} from './serialize'

export class TimerConfigStorageService implements StorageService<TimerConfig> {
  static readonly STORAGE_KEY: StorageKey = 'timerConfig'

  private storageManager: StorageManager<SerializedTimerConfig>

  private unsubscribes: (() => void)[] = []

  constructor(storage: ObservableStorage | StorageInterface) {
    this.storageManager = StorageManager.create({
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
