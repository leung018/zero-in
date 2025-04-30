import { describe, expect, it } from 'vitest'
import { TimerStateStorageService, STORAGE_KEY } from './storage'
import { TimerStage } from '../stage'
import type { TimerState } from '.'
import { FakeStorage } from '../../../infra/storage'
import type { TimerStateSchemas } from './serialize'

describe('TimerStateStorageService', () => {
  it('should get null if no TimerState is saved ', async () => {
    const timerStateStorageService = TimerStateStorageService.createFake()
    expect(await timerStateStorageService.get()).toBeNull()
  })

  it('should save and get TimerState', async () => {
    const timerStateStorageService = TimerStateStorageService.createFake()
    const timerState: TimerState = {
      remainingSeconds: 100,
      isRunning: true,
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 9
    }

    await timerStateStorageService.save(timerState)
    expect(await timerStateStorageService.get()).toStrictEqual(timerState)
  })
})

describe('TimerStateStorageService with migration', () => {
  it('should migrate properly', async () => {
    const fakeStorage = new FakeStorage()
    const data: TimerStateSchemas[0] = {
      remainingSeconds: 100,
      isRunning: true,
      stage: 0,
      numOfPomodoriCompleted: 9
    }
    fakeStorage.set({
      [STORAGE_KEY]: data
    })

    const timerStateStorageService = TimerStateStorageService.createFake(fakeStorage)
    const expected: TimerState = {
      remainingSeconds: 100,
      isRunning: true,
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 9
    }
    const result = await timerStateStorageService.get()
    expect(result).toStrictEqual(expected)
  })
})
