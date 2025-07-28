import { expect, it } from 'vitest'
import { TimerConfig } from '.'
import config from '../../../config'
import { StorageInterface } from '../../../infra/storage/interface'
import { Duration } from '../duration'
import { TimerConfigStorageService } from './storage'

export function runTimerConfigStorageServiceTests(storage: StorageInterface) {
  it('should initial value from TimerConfigStorageService same as config.getDefaultTimerConfig()', async () => {
    const service = new TimerConfigStorageService(storage)
    const timerConfig = await service.get()

    expect(timerConfig).toStrictEqual(config.getDefaultTimerConfig())
  })

  it('should save and get TimerConfig', async () => {
    const service = new TimerConfigStorageService(storage)
    const timerConfig = new TimerConfig({
      focusDuration: new Duration({ minutes: 100 }),
      shortBreakDuration: new Duration({ minutes: 101 }),
      longBreakDuration: new Duration({ minutes: 102 }),
      focusSessionsPerCycle: 8
    })
    await service.save(timerConfig)
    expect(await service.get()).toStrictEqual(timerConfig)
  })
}
