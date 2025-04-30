import { describe, expect, it } from 'vitest'
import { TimerConfigStorageService } from './storage'
import config from '../../../config'
import { TimerConfig } from '.'
import { Duration } from '../duration'

describe('TimerConfigStorageService', () => {
  it('should initial value from TimerConfigStorageService same as config.getDefaultTimerConfig()', async () => {
    const timerConfigStorageService = TimerConfigStorageService.createFake()
    const timerConfig = await timerConfigStorageService.get()

    expect(timerConfig).toEqual(config.getDefaultTimerConfig())
  })

  it('should save and get TimerConfig', async () => {
    const timerConfigStorageService = TimerConfigStorageService.createFake()
    const timerConfig = new TimerConfig({
      focusDuration: new Duration({ minutes: 100 }),
      shortBreakDuration: new Duration({ minutes: 101 }),
      longBreakDuration: new Duration({ minutes: 102 }),
      focusSessionsPerCycle: 8
    })
    await timerConfigStorageService.save(timerConfig)
    expect(await timerConfigStorageService.get()).toStrictEqual(timerConfig)
  })
})
