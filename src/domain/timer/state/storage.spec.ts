import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LocalStorageWrapper } from '../../../infra/storage/local_storage_wrapper'
import { Duration } from '../duration'
import { TimerStage } from '../stage'
import { TimerInternalState } from './internal'
import type { TimerStateSchemas } from './schema'
import { TimerStateStorageService } from './storage'
import { runTimerStateStorageServiceTests } from './storage_shared_spec'

describe('TimerStateStorageService', () => {
  let storage = LocalStorageWrapper.createFake()

  beforeEach(() => {
    storage = LocalStorageWrapper.createFake()
  })

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  runTimerStateStorageServiceTests(storage)

  it('should migrate properly if isRunning true', async () => {
    const data: TimerStateSchemas[0] = {
      remainingSeconds: 100,
      isRunning: true,
      stage: 0,
      numOfPomodoriCompleted: 9
    }
    storage.set(TimerStateStorageService.STORAGE_KEY, data)

    const timerStateStorageService = TimerStateStorageService.createFake(storage)
    const result = await timerStateStorageService.get()
    expect(result).toStrictEqual(
      TimerInternalState.newRunningState({
        sessionStartTime: undefined,
        remaining: new Duration({ seconds: 100 }),
        stage: TimerStage.FOCUS,
        focusSessionsCompleted: 9
      })
    )
  })

  it('should migrate properly if isRunning false', async () => {
    const data: TimerStateSchemas[0] = {
      remainingSeconds: 49,
      isRunning: false,
      stage: 1,
      numOfPomodoriCompleted: 0
    }
    storage.set(TimerStateStorageService.STORAGE_KEY, data)

    const timerStateStorageService = TimerStateStorageService.createFake(storage)
    const result = await timerStateStorageService.get()
    expect(result).toStrictEqual(
      TimerInternalState.newPausedState({
        remaining: new Duration({ seconds: 49 }),
        stage: TimerStage.SHORT_BREAK,
        focusSessionsCompleted: 0
      })
    )
  })
})
