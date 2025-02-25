import { describe, expect, it } from 'vitest'
import { PomodoroTimer, type PomodoroTimerState } from './timer'
import { Duration } from './duration'
import { PomodoroStage } from './stage'
import { FakePeriodicTaskScheduler } from '../../infra/scheduler'
import { flushPromises } from '@vue/test-utils'

describe('PomodoroTimer', () => {
  it('should initial state is set correctly', () => {
    const { timer, scheduler } = createTimer({
      focusDuration: new Duration({ minutes: 10 })
    })
    scheduler.advanceTime(5000) // if the timer is not started, the time should not change

    expect(timer.getState()).toEqual({
      remaining: new Duration({ minutes: 10 }),
      isRunning: false,
      stage: PomodoroStage.FOCUS
    })
  })

  it('should able to start focus', () => {
    const { timer, scheduler } = createTimer({
      focusDuration: new Duration({ minutes: 10 })
    })
    timer.start()
    scheduler.advanceTime(5001)

    expect(timer.getState()).toEqual({
      remaining: new Duration({ minutes: 9, seconds: 55 }),
      isRunning: true,
      stage: PomodoroStage.FOCUS
    })
  })

  it("should extra call of start won't affect the timer", () => {
    const { timer, scheduler } = createTimer({
      focusDuration: new Duration({ minutes: 10 })
    })

    timer.start()
    scheduler.advanceTime(5950)
    timer.start()
    scheduler.advanceTime(5050)

    expect(timer.getState().remaining).toEqual(new Duration({ minutes: 9, seconds: 49 }))
  })

  it('should able to pause', () => {
    const { timer, scheduler } = createTimer({
      focusDuration: new Duration({ minutes: 10 })
    })
    timer.start()
    scheduler.advanceTime(5000)
    timer.pause()
    scheduler.advanceTime(5000)

    expect(timer.getState()).toEqual({
      remaining: new Duration({ minutes: 9, seconds: 55 }),
      isRunning: false,
      stage: PomodoroStage.FOCUS
    })
  })

  it('should pause and start remain accuracy to 100ms', () => {
    const { timer, scheduler } = createTimer({
      focusDuration: new Duration({ minutes: 10 })
    })
    timer.start()
    scheduler.advanceTime(5200)
    timer.pause()
    timer.start()
    scheduler.advanceTime(5800)

    expect(timer.getState().remaining).toEqual(new Duration({ minutes: 9, seconds: 49 }))
  })

  it('should able to subscribe change of states', () => {
    const { timer, scheduler } = createTimer({
      focusDuration: new Duration({ minutes: 10 })
    })
    const changes: PomodoroTimerState[] = []
    timer.setOnTimerUpdate((state) => {
      changes.push(state)
    })

    timer.start()
    scheduler.advanceTime(250)

    expect(changes).toEqual([
      {
        remaining: new Duration({ minutes: 10, seconds: 0, milliseconds: 0 }),
        isRunning: true,
        stage: PomodoroStage.FOCUS
      },
      {
        remaining: new Duration({ minutes: 9, seconds: 59, milliseconds: 900 }),
        isRunning: true,
        stage: PomodoroStage.FOCUS
      },
      {
        remaining: new Duration({ minutes: 9, seconds: 59, milliseconds: 800 }),
        isRunning: true,
        stage: PomodoroStage.FOCUS
      }
    ])
  })

  it('should able to trigger callback when stage transit', async () => {
    const { timer, scheduler } = createTimer({
      focusDuration: new Duration({ minutes: 1 }),
      shortBreakDuration: new Duration({ seconds: 30 })
    })
    let triggeredCount = 0
    timer.setOnStageTransit(() => {
      triggeredCount++
    })

    timer.start()
    scheduler.advanceTime(60000)
    await flushPromises()

    expect(triggeredCount).toBe(1)

    timer.start()
    scheduler.advanceTime(30000)
    await flushPromises()

    expect(triggeredCount).toBe(2)
  })

  it('should switch to break after focus duration is passed', () => {
    const { timer, scheduler } = createTimer({
      focusDuration: new Duration({ minutes: 1 }),
      shortBreakDuration: new Duration({ seconds: 30 })
    })
    timer.start()
    scheduler.advanceTime(61000)

    expect(timer.getState()).toEqual({
      remaining: new Duration({ seconds: 30 }),
      isRunning: false,
      stage: PomodoroStage.SHORT_BREAK
    })
  })

  it('should switch back to focus after break duration is passed', () => {
    const { timer, scheduler } = createTimer({
      focusDuration: new Duration({ minutes: 1 }),
      shortBreakDuration: new Duration({ seconds: 30 })
    })
    timer.start()
    scheduler.advanceTime(61000)
    timer.start()
    scheduler.advanceTime(31000)

    expect(timer.getState()).toEqual({
      remaining: new Duration({ minutes: 1 }),
      isRunning: false,
      stage: PomodoroStage.FOCUS
    })
  })

  it('should start long break after number of focus per cycle is passed', () => {
    const { timer, scheduler } = createTimer({
      focusDuration: new Duration({ minutes: 1 }),
      shortBreakDuration: new Duration({ seconds: 15 }),
      longBreakDuration: new Duration({ seconds: 30 }),
      numOfFocusPerCycle: 2
    })

    // 1st Focus
    timer.start()
    scheduler.advanceTime(60000)

    // Short Break
    timer.start()
    scheduler.advanceTime(15000)

    // 2nd Focus
    timer.start()
    scheduler.advanceTime(60000)

    // Long Break
    expect(timer.getState()).toEqual({
      remaining: new Duration({ seconds: 30 }),
      isRunning: false,
      stage: PomodoroStage.LONG_BREAK
    })
    timer.start()
    scheduler.advanceTime(30000)
  })

  it('should reset the cycle after long break', () => {
    const { timer, scheduler } = createTimer({
      focusDuration: new Duration({ minutes: 1 }),
      shortBreakDuration: new Duration({ seconds: 15 }),
      longBreakDuration: new Duration({ seconds: 30 }),
      numOfFocusPerCycle: 2
    })

    // 1st Focus
    timer.start()
    scheduler.advanceTime(60000)

    // Short Break
    timer.start()
    scheduler.advanceTime(15000)

    // 2nd Focus
    timer.start()
    scheduler.advanceTime(60000)

    // Long Break
    timer.start()
    scheduler.advanceTime(30000)

    // After Long Break, it should reset to Focus
    expect(timer.getState()).toEqual({
      remaining: new Duration({ minutes: 1 }),
      isRunning: false,
      stage: PomodoroStage.FOCUS
    })

    timer.start()
    scheduler.advanceTime(60000)

    // Short Break
    timer.start()
    scheduler.advanceTime(15000)

    // 3rd Focus
    timer.start()
    scheduler.advanceTime(60000)

    // Long Break again
    expect(timer.getState()).toEqual({
      remaining: new Duration({ seconds: 30 }),
      isRunning: false,
      stage: PomodoroStage.LONG_BREAK
    })
  })
})

function createTimer({
  focusDuration = new Duration({ minutes: 25 }),
  shortBreakDuration = new Duration({ minutes: 5 }),
  longBreakDuration = new Duration({ minutes: 15 }),
  numOfFocusPerCycle = 4
} = {}) {
  const scheduler = new FakePeriodicTaskScheduler()
  const timer = PomodoroTimer.createFake({
    focusDuration,
    shortBreakDuration,
    longBreakDuration,
    numOfFocusPerCycle,
    scheduler
  })
  return {
    scheduler,
    timer
  }
}
