import { beforeEach, describe, expect, it } from 'vitest'
import { TimerBasedBlocking } from '.'
import { LocalStorageWrapper } from '../../infra/storage/local_storage'
import { TimerBasedBlockingSchemas } from './schema'
import { TimerBasedBlockingStorageService } from './storage'
import { runTimerBasedBlockingStorageServiceTests } from './storage_shared_spec'

describe('TimerBasedBlockingStorageService', () => {
  let storage = LocalStorageWrapper.createFake()

  beforeEach(() => {
    storage = LocalStorageWrapper.createFake()
  })

  runTimerBasedBlockingStorageServiceTests(storage)

  it('should migrate properly', async () => {
    const data: TimerBasedBlockingSchemas[0] = {
      shouldPauseBlockingDuringBreaks: true
    }
    storage.set(TimerBasedBlockingStorageService.STORAGE_KEY, data)
    const service = new TimerBasedBlockingStorageService(storage)
    const expected: TimerBasedBlocking = {
      pauseBlockingDuringBreaks: true,
      pauseBlockingWhenTimerNotRunning: false
    }
    const result = await service.get()
    expect(result).toStrictEqual(expected)
  })
})
