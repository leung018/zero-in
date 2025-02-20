import { describe, expect, it } from 'vitest'
import { PomodoroTimer, type PomodoroTimerState } from './pomodoro_timer'
import { Duration } from './duration'
import { PomodoroState } from './state'
import { FakePeriodicTaskScheduler } from '../../infra/scheduler'

describe('PomodoroTimer', () => {
  it('should initial state is set correctly', () => {
    const { timer, scheduler } = createTimer({
      focusDuration: new Duration({ minutes: 10 })
    })
    scheduler.advanceTime(5000) // if the timer is not started, the time should not change

    expect(timer.getState()).toEqual({
      remaining: new Duration({ minutes: 10 }),
      isRunning: false,
      pomodoroState: PomodoroState.FOCUS
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
      pomodoroState: PomodoroState.FOCUS
    })
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
      pomodoroState: PomodoroState.FOCUS
    })
  })

  it('should able to subscribe change of states', () => {
    const { timer, scheduler } = createTimer({
      focusDuration: new Duration({ minutes: 10 })
    })
    const changes: PomodoroTimerState[] = []
    timer.subscribe((state) => {
      changes.push(state)
    })

    timer.start()
    scheduler.advanceTime(2000)

    expect(changes).toEqual([
      {
        remaining: new Duration({ minutes: 10, seconds: 0 }),
        isRunning: true,
        pomodoroState: PomodoroState.FOCUS
      },
      {
        remaining: new Duration({ minutes: 9, seconds: 59 }),
        isRunning: true,
        pomodoroState: PomodoroState.FOCUS
      },
      {
        remaining: new Duration({ minutes: 9, seconds: 58 }),
        isRunning: true,
        pomodoroState: PomodoroState.FOCUS
      }
    ])
  })
})

function createTimer({ focusDuration = new Duration({ minutes: 25 }) } = {}) {
  const scheduler = new FakePeriodicTaskScheduler()
  const timer = PomodoroTimer.createFake({ focusDuration, scheduler })
  return {
    scheduler,
    timer
  }
}
