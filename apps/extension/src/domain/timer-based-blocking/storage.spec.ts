import { beforeEach, describe, expect, it } from 'vitest'
import { TimerBasedBlockingRules } from '.'
import { LocalStorageWrapper } from '../../infra/storage/local-storage'
import { TimerBasedBlockingRulesSchemas } from './schema'
import { TimerBasedBlockingRulesStorageService } from './storage'
import { runTimerBasedBlockingRulesStorageServiceTests } from './storage-shared-spec'

describe('TimerBasedBlockingRulesStorageService', () => {
  let storage = LocalStorageWrapper.createFake()

  beforeEach(() => {
    storage = LocalStorageWrapper.createFake()
  })

  runTimerBasedBlockingRulesStorageServiceTests(storage)

  it('should migrate properly', async () => {
    const data: TimerBasedBlockingRulesSchemas[0] = {
      shouldPauseBlockingDuringBreaks: true
    }
    storage.set(TimerBasedBlockingRulesStorageService.STORAGE_KEY, data)
    const service = new TimerBasedBlockingRulesStorageService(storage)
    const expected: TimerBasedBlockingRules = {
      pauseBlockingDuringBreaks: true,
      pauseBlockingWhenTimerNotRunning: false
    }
    const result = await service.get()
    expect(result).toStrictEqual(expected)
  })
})
