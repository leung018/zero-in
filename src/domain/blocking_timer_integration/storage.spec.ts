import { describe, expect, it } from 'vitest'
import type { BlockingTimerIntegration } from '.'
import config from '../../config'
import { FakeStorage } from '../../infra/storage'
import type { BlockingTimerIntegrationSchemas } from './serialize'
import { BlockingTimerIntegrationStorageService } from './storage'

describe('BlockingTimerIntegrationStorageService', () => {
  it('should get default setting when no setting is saved', async () => {
    const service = BlockingTimerIntegrationStorageService.createFake()
    expect(await service.get()).toEqual(config.getDefaultBlockingTimerIntegration())
  })

  it('should save and get setting', async () => {
    const service = BlockingTimerIntegrationStorageService.createFake()
    const setting: BlockingTimerIntegration = {
      shouldPauseBlockingDuringBreaks: false,
      shouldPauseBlockingWhenTimerIsNotRunning: true
    }
    await service.save(setting)
    expect(await service.get()).toEqual(setting)
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
      shouldPauseBlockingWhenTimerIsNotRunning: false
    }
    const result = await service.get()
    expect(result).toStrictEqual(expected)
  })
})
