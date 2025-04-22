import { describe, expect, it } from 'vitest'
import { TimerIntegrationSettingStorageService } from './storage'
import type { TimerIntegrationSetting } from '.'

describe('TimerIntegrationSettingStorageService', () => {
  it('should get default setting when no setting is saved', async () => {
    const service = TimerIntegrationSettingStorageService.createFake()
    const expected: TimerIntegrationSetting = {
      shouldPauseBlockingDuringBreaks: true
    }
    expect(await service.get()).toEqual(expected)
  })

  it('should save and get setting', async () => {
    const service = TimerIntegrationSettingStorageService.createFake()
    const setting: TimerIntegrationSetting = {
      shouldPauseBlockingDuringBreaks: false
    }
    await service.save(setting)
    expect(await service.get()).toEqual(setting)
  })
})
