import { describe, expect, it } from 'vitest'
import { TimerStateStorageService } from './storage'
import { PomodoroStage } from '../stage'
import type { TimerState } from '.'

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
      stage: PomodoroStage.FOCUS,
      numOfPomodoriCompleted: 9
    }

    await timerStateStorageService.save(timerState)
    expect(await timerStateStorageService.get()).toStrictEqual(timerState)
  })
})
