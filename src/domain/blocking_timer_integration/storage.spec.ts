import { describe, expect, it } from 'vitest'
import type { BlockingTimerIntegration } from '.'
import config from '../../config'
import { FakeStorage } from '../../infra/storage'
import type { BlockingTimerIntegrationSchemas } from './serialize'
import { BlockingTimerIntegrationStorageService } from './storage'

describe('BlockingTimerIntegrationStorageService', () => {
  it('should get default integration setting when no integration setting is saved', async () => {
    const service = BlockingTimerIntegrationStorageService.createFake()
    expect(await service.get()).toStrictEqual(config.getDefaultBlockingTimerIntegration())
  })

  it('should save and get integration setting', async () => {
    const service = BlockingTimerIntegrationStorageService.createFake()
    const integration: BlockingTimerIntegration = {
      shouldPauseBlockingDuringBreaks: false,
      pauseBlockingWhenTimerIdle: true
    }
    await service.save(integration)
    expect(await service.get()).toStrictEqual(integration)
  })

  it('should migrate properly', async () => {
    const fakeStorage = new FakeStorage()
    const data: BlockingTimerIntegrationSchemas[0] = {
      shouldPauseBlockingDuringBreaks: true
    }
    fakeStorage.set({
      [BlockingTimerIntegrationStorageService.STORAGE_KEY]: data
    })
    const service = BlockingTimerIntegrationStorageService.createFake(fakeStorage)
    const expected: BlockingTimerIntegration = {
      shouldPauseBlockingDuringBreaks: true,
      pauseBlockingWhenTimerIdle: false
    }
    const result = await service.get()
    expect(result).toStrictEqual(expected)
  })
})
