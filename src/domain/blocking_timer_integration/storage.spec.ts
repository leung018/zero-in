import { describe, expect, it } from 'vitest'
import type { BlockingTimerIntegration } from '.'
import config from '../../config'
import { BlockingTimerIntegrationStorageService } from './storage'

describe('BlockingTimerIntegrationStorageService', () => {
  it('should get default setting when no setting is saved', async () => {
    const service = BlockingTimerIntegrationStorageService.createFake()
    expect(await service.get()).toEqual(config.getDefaultBlockingTimerIntegration())
  })

  it('should save and get setting', async () => {
    const service = BlockingTimerIntegrationStorageService.createFake()
    const setting: BlockingTimerIntegration = {
      shouldPauseBlockingDuringBreaks: false
    }
    await service.save(setting)
    expect(await service.get()).toEqual(setting)
  })
})
