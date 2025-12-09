import { FakeObservableStorage } from '@zero-in/shared/infra/storage/fake'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Duration } from '../duration'
import { TimerStage } from '../stage'
import { TimerInternalState } from './internal'
import type { TimerStateSchemas } from './schema'
import { TimerStateStorageService } from './storage'
import { runTimerStateStorageServiceTests } from './storage-shared-spec'

describe('TimerStateStorageService', () => {
  let storage = FakeObservableStorage.create()

  beforeEach(() => {
    storage = FakeObservableStorage.create()
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

    const timerStateStorageService = new TimerStateStorageService(storage)
    const result = await timerStateStorageService.get()
    expect(result).toStrictEqual(
      TimerInternalState.newRunningState({
        sessionStartTime: null,
        remaining: new Duration({ seconds: 100 }),
        stage: TimerStage.FOCUS,
        focusSessionsCompleted: 9,
        timerId: ''
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

    const timerStateStorageService = new TimerStateStorageService(storage)
    const result = await timerStateStorageService.get()
    expect(result).toStrictEqual(
      TimerInternalState.newPausedState({
        remaining: new Duration({ seconds: 49 }),
        stage: TimerStage.SHORT_BREAK,
        focusSessionsCompleted: 0,
        timerId: ''
      })
    )
  })
})
