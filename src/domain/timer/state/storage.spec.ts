import { getDateAfter } from '@/utils/date'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LocalStorageWrapper } from '../../../infra/storage/local_storage_wrapper'
import { Duration } from '../duration'
import { TimerStage } from '../stage'
import { TimerInternalState } from './internal'
import type { TimerStateSchemas } from './schema'
import { TimerStateStorageService } from './storage'

describe('TimerStateStorageService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should get null if no TimerState is saved ', async () => {
    const timerStateStorageService = TimerStateStorageService.createFake()
    expect(await timerStateStorageService.get()).toBeNull()
  })

  it('should save and get TimerState', async () => {
    const timerStateStorageService = TimerStateStorageService.createFake()

    const state = new TimerInternalState({
      pausedAt: new Date(),
      endAt: getDateAfter({ duration: new Duration({ seconds: 100 }) }),
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 9
    })
    await timerStateStorageService.save(state)
    expect(await timerStateStorageService.get()).toStrictEqual(state)

    const state2 = new TimerInternalState({
      pausedAt: undefined,
      endAt: getDateAfter({ duration: new Duration({ seconds: 100 }) }),
      stage: TimerStage.SHORT_BREAK,
      focusSessionsCompleted: 0
    })
    await timerStateStorageService.save(state2)
    expect(await timerStateStorageService.get()).toStrictEqual(state2)
  })

  it('should migrate properly if isRunning true', async () => {
    const fakeStorage = LocalStorageWrapper.createFake()
    const data: TimerStateSchemas[0] = {
      remainingSeconds: 100,
      isRunning: true,
      stage: 0,
      numOfPomodoriCompleted: 9
    }
    fakeStorage.set(TimerStateStorageService.STORAGE_KEY, data)

    const timerStateStorageService = TimerStateStorageService.createFake(fakeStorage)
    const result = await timerStateStorageService.get()
    expect(result).toStrictEqual(
      new TimerInternalState({
        pausedAt: undefined,
        endAt: getDateAfter({ duration: new Duration({ seconds: 100 }) }),
        stage: TimerStage.FOCUS,
        focusSessionsCompleted: 9
      })
    )
  })

  it('should migrate properly if isRunning false', async () => {
    const fakeStorage = LocalStorageWrapper.createFake()
    const data: TimerStateSchemas[0] = {
      remainingSeconds: 49,
      isRunning: false,
      stage: 1,
      numOfPomodoriCompleted: 0
    }
    fakeStorage.set(TimerStateStorageService.STORAGE_KEY, data)

    const timerStateStorageService = TimerStateStorageService.createFake(fakeStorage)
    const result = await timerStateStorageService.get()
    expect(result).toStrictEqual(
      new TimerInternalState({
        pausedAt: new Date(),
        endAt: getDateAfter({ duration: new Duration({ seconds: 49 }) }),
        stage: TimerStage.SHORT_BREAK,
        focusSessionsCompleted: 0
      })
    )
  })
})
