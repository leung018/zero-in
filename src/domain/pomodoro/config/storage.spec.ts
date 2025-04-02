import { expect, it } from 'vitest'
import { TimerConfigStorageService } from './storage'
import config from '../../../config'

// TimerConfigStorageService is mainly covered in other test cases. Here just confirm the default value

it('should initial value from TimerConfigStorageService same as config.getDefaultTimerConfig()', async () => {
  const timerConfigStorageService = TimerConfigStorageService.createFake()
  const timerConfig = await timerConfigStorageService.get()

  expect(timerConfig).toEqual(config.getDefaultTimerConfig())
})
