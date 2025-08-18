import { beforeEach, describe, expect, it } from 'vitest'
import { BlockingTimerIntegration } from '.'
import { FakeObservableStorage } from '../../infra/storage/fake'
import { BlockingTimerIntegrationSchemas } from './schema'
import { BlockingTimerIntegrationStorageService } from './storage'
import { runBlockingTimerIntegrationStorageServiceTests } from './storage_shared_spec'

describe('BlockingTimerIntegrationStorageService', () => {
  let storage = FakeObservableStorage.create()

  beforeEach(() => {
    storage = FakeObservableStorage.create()
  })

  runBlockingTimerIntegrationStorageServiceTests(storage)

  it('should migrate properly', async () => {
    const data: BlockingTimerIntegrationSchemas[0] = {
      shouldPauseBlockingDuringBreaks: true
    }
    storage.set(BlockingTimerIntegrationStorageService.STORAGE_KEY, data)
    const service = new BlockingTimerIntegrationStorageService(storage)
    const expected: BlockingTimerIntegration = {
      pauseBlockingDuringBreaks: true,
      pauseBlockingWhenTimerNotRunning: false
    }
    const result = await service.get()
    expect(result).toStrictEqual(expected)
  })
})
