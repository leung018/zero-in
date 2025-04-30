import { describe, expect, it } from 'vitest'
import { FocusTimer } from '.'
import { Duration } from './duration'
import { TimerStage } from './stage'
import { FakePeriodicTaskScheduler } from '../../infra/scheduler'
import { TimerConfig } from './config'
import { newTestTimerState, type TimerState } from './state'

describe('FocusTimer', () => {
  it('should initial state is set correctly', () => {
    const { timer, scheduler } = createTimer(
      newConfig({
        focusDuration: new Duration({ minutes: 10 })
      })
    )
    scheduler.advanceTime(1000) // if the timer is not started, the time should not change

    const expected: TimerState = {
      remainingSeconds: new Duration({ minutes: 10 }).remainingSeconds(),
      isRunning: false,
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 0
    }
    expect(timer.getState()).toEqual(expected)
  })

  it('should round up to seconds of duration in the config', () => {
    // Since some timer publishing logic is assume that the smallest unit is second, duration in config is enforced in second precision to keep that correct

    const { timer } = createTimer(
      newConfig({
        focusDuration: new Duration({ seconds: 10, milliseconds: 1 }),
        shortBreakDuration: new Duration({ seconds: 3, milliseconds: 1 }),
        longBreakDuration: new Duration({ seconds: 2, milliseconds: 1 }),
        focusSessionsPerCycle: 5
      })
    )

    let expected: TimerConfig = {
      focusDuration: new Duration({ seconds: 11 }),
      shortBreakDuration: new Duration({ seconds: 4 }),
      longBreakDuration: new Duration({ seconds: 3 }),
      focusSessionsPerCycle: 5
    }
    expect(timer.getConfig()).toEqual(expected)

    // Set operation have same effects
    timer.setConfig(
      newConfig({
        focusDuration: new Duration({ minutes: 5, milliseconds: 1 }),
        shortBreakDuration: new Duration({ minutes: 2, milliseconds: 1 }),
        longBreakDuration: new Duration({ minutes: 3, milliseconds: 1 }),
        focusSessionsPerCycle: 4
      })
    )

    expected = {
      focusDuration: new Duration({ minutes: 5, seconds: 1 }),
      shortBreakDuration: new Duration({ minutes: 2, seconds: 1 }),
      longBreakDuration: new Duration({ minutes: 3, seconds: 1 }),
      focusSessionsPerCycle: 4
    }
    expect(timer.getConfig()).toEqual(expected)
  })

  it('should setConfig reset the state too', () => {
    const { timer, scheduler } = createTimer(
      newConfig({
        focusDuration: new Duration({ minutes: 10 }),
        focusSessionsPerCycle: 4
      })
    )
    timer.restartFocus(3)
    scheduler.advanceTime(1000)

    timer.setConfig(
      newConfig({
        focusDuration: new Duration({ minutes: 4, seconds: 59, milliseconds: 1 })
      })
    )

    const expected: TimerState = {
      remainingSeconds: new Duration({ minutes: 5 }).remainingSeconds(),
      isRunning: false,
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 0
    }
    expect(timer.getState()).toEqual(expected)
  })

  it('should able to start focus', () => {
    const { timer, scheduler } = createTimer(
      newConfig({
        focusDuration: new Duration({ minutes: 10 })
      })
    )
    timer.start()
    scheduler.advanceTime(1001)

    const expected: TimerState = {
      remainingSeconds: new Duration({ minutes: 9, seconds: 59 }).remainingSeconds(),
      isRunning: true,
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 0
    }
    expect(timer.getState()).toEqual(expected)
  })

  it("should extra call of start won't affect the timer", () => {
    const { timer, scheduler } = createTimer(
      newConfig({
        focusDuration: new Duration({ minutes: 10 })
      })
    )

    timer.start()
    scheduler.advanceTime(950)
    timer.start()
    scheduler.advanceTime(1050)

    expect(timer.getState().remainingSeconds).toBe(
      new Duration({ minutes: 9, seconds: 58 }).remainingSeconds()
    )
  })

  it('should able to pause', () => {
    const { timer, scheduler } = createTimer(
      newConfig({
        focusDuration: new Duration({ minutes: 10 })
      })
    )
    timer.start()
    scheduler.advanceTime(1000)
    timer.pause()
    scheduler.advanceTime(1000)

    const expected: TimerState = {
      remainingSeconds: new Duration({ minutes: 9, seconds: 59 }).remainingSeconds(),
      isRunning: false,
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 0
    }
    expect(timer.getState()).toEqual(expected)
  })

  it('should pause and start remain accuracy to 100ms', () => {
    const { timer, scheduler } = createTimer(
      newConfig({
        focusDuration: new Duration({ minutes: 10 })
      })
    )
    timer.start()
    scheduler.advanceTime(1200)
    timer.pause()
    timer.start()
    scheduler.advanceTime(1800)

    expect(timer.getState().remainingSeconds).toBe(
      new Duration({ minutes: 9, seconds: 57 }).remainingSeconds()
    )
  })

  it('should able to subscribe updates', () => {
    const { timer, scheduler } = createTimer(
      newConfig({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 5 }),
        focusSessionsPerCycle: 4
      })
    )
    const updates: TimerState[] = []
    timer.setOnTimerUpdate((update) => {
      updates.push(update)
    })

    timer.start()
    scheduler.advanceTime(2000)

    const expectedUpdates: TimerState[] = [
      {
        remainingSeconds: 3,
        isRunning: false,
        stage: TimerStage.FOCUS,
        focusSessionsCompleted: 0
      },
      {
        remainingSeconds: 3,
        isRunning: true,
        stage: TimerStage.FOCUS,
        focusSessionsCompleted: 0
      },
      {
        remainingSeconds: 2,
        isRunning: true,
        stage: TimerStage.FOCUS,
        focusSessionsCompleted: 0
      },
      {
        remainingSeconds: 1,
        isRunning: true,
        stage: TimerStage.FOCUS,
        focusSessionsCompleted: 0
      }
    ]
    expect(updates).toEqual(expectedUpdates)

    scheduler.advanceTime(2000)

    expect(updates.length).toBe(5)
    const expectedLastUpdate: TimerState = {
      remainingSeconds: 5,
      isRunning: false,
      stage: TimerStage.SHORT_BREAK,
      focusSessionsCompleted: 1
    }
    expect(updates[4]).toEqual(expectedLastUpdate)
  })

  it('should receive immediate update whenever timer pause', () => {
    const { timer, scheduler } = createTimer(
      newConfig({
        focusDuration: new Duration({ minutes: 10 })
      })
    )
    const updates: TimerState[] = []
    timer.setOnTimerUpdate((update) => {
      updates.push(update)
    })

    timer.start()
    scheduler.advanceTime(2000)

    const lastUpdatesLength = updates.length

    timer.pause()

    expect(updates[lastUpdatesLength].isRunning).toBe(false)
    expect(updates[lastUpdatesLength].remainingSeconds).toBe(
      new Duration({ minutes: 9, seconds: 58 }).remainingSeconds()
    )
  })

  it('should after pause and restart again, subscription can receive updates properly', () => {
    const { timer, scheduler } = createTimer(
      newConfig({
        focusDuration: new Duration({ minutes: 10 })
      })
    )
    const updates: TimerState[] = []
    timer.setOnTimerUpdate((update) => {
      updates.push(update)
    })

    timer.start()
    scheduler.advanceTime(1400)

    timer.pause()

    const lastUpdatesLength = updates.length

    timer.start()
    scheduler.advanceTime(600)

    expect(updates[lastUpdatesLength].remainingSeconds).toBe(
      new Duration({ minutes: 9, seconds: 59 }).remainingSeconds() // Whenever timer is started, it will publish the current state
    )
    expect(updates[lastUpdatesLength + 1].remainingSeconds).toBe(
      new Duration({ minutes: 9, seconds: 58 }).remainingSeconds() // After 600ms since restart, the remaining time should be 9:58 and it should be published
    )
  })

  it('should receive immediate update whenever subscribe', () => {
    const { timer, scheduler } = createTimer(
      newConfig({
        focusDuration: new Duration({ minutes: 10 })
      })
    )
    const updates: TimerState[] = []
    timer.start()
    scheduler.advanceTime(1005)

    timer.setOnTimerUpdate((update) => {
      updates.push(update)
    })

    // although the update will be published every 1000ms, should receive immediate response when subscribe
    expect(updates.length).toBe(1)
    expect(updates[0].remainingSeconds).toBe(
      new Duration({ minutes: 9, seconds: 59 }).remainingSeconds()
    )
  })
  it('should able to trigger callback when stage transit', async () => {
    const { timer, scheduler } = createTimer(
      newConfig({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 1 })
      })
    )
    let lastStage: TimerStage | null = null
    timer.setOnStageComplete((stage) => {
      lastStage = stage
    })

    timer.start()
    scheduler.advanceTime(3000)

    expect(lastStage).toBe(TimerStage.FOCUS)

    timer.start()
    scheduler.advanceTime(1000)

    expect(lastStage).toBe(TimerStage.SHORT_BREAK)
  })

  it('should switch to break after focus duration is passed', () => {
    const { timer, scheduler } = createTimer(
      newConfig({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 1 })
      })
    )
    timer.start()
    scheduler.advanceTime(3000)

    const expected: TimerState = {
      remainingSeconds: 1,
      isRunning: false,
      stage: TimerStage.SHORT_BREAK,
      focusSessionsCompleted: 1
    }
    expect(timer.getState()).toEqual(expected)
  })

  it('should switch back to focus after break duration is passed', () => {
    const { timer, scheduler } = createTimer(
      newConfig({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 1 })
      })
    )
    timer.start()
    scheduler.advanceTime(3000)
    timer.start()
    scheduler.advanceTime(1000)

    const expected: TimerState = {
      remainingSeconds: 3,
      isRunning: false,
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 1
    }
    expect(timer.getState()).toEqual(expected)
  })

  it('should start long break after finish all focus sessions in that cycle', () => {
    const { timer, scheduler } = createTimer(
      newConfig({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 1 }),
        longBreakDuration: new Duration({ seconds: 2 }),
        focusSessionsPerCycle: 2
      })
    )

    // 1st Focus
    timer.start()
    scheduler.advanceTime(3000)

    // Short Break
    timer.start()
    scheduler.advanceTime(1000)

    // 2nd Focus
    timer.start()
    scheduler.advanceTime(3000)

    // Long Break
    const expected: TimerState = {
      remainingSeconds: 2,
      isRunning: false,
      stage: TimerStage.LONG_BREAK,
      focusSessionsCompleted: 2
    }
    expect(timer.getState()).toEqual(expected)
  })

  it('should reset the cycle after long break', () => {
    const { timer, scheduler } = createTimer(
      newConfig({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 1 }),
        longBreakDuration: new Duration({ seconds: 2 }),
        focusSessionsPerCycle: 2
      })
    )

    // 1st Focus
    timer.start()
    scheduler.advanceTime(3000)

    // Short Break
    timer.start()
    scheduler.advanceTime(1000)

    // 2nd Focus
    timer.start()
    scheduler.advanceTime(3000)

    // Long Break
    timer.start()
    scheduler.advanceTime(2000)

    // After Long Break, it should reset to Focus
    let expected: TimerState = {
      remainingSeconds: 3,
      isRunning: false,
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 0
    }
    expect(timer.getState()).toEqual(expected)

    // 1st Focus
    timer.start()
    scheduler.advanceTime(3000)

    // Short Break
    timer.start()
    scheduler.advanceTime(1000)

    // 2rd Focus
    timer.start()
    scheduler.advanceTime(3000)

    // Long Break again
    expected = {
      remainingSeconds: 2,
      isRunning: false,
      stage: TimerStage.LONG_BREAK,
      focusSessionsCompleted: 2
    }
    expect(timer.getState()).toEqual(expected)
  })

  it('should able to jump to short break', () => {
    const { timer, scheduler } = createTimer(
      newConfig({
        focusDuration: new Duration({ seconds: 10 }),
        shortBreakDuration: new Duration({ seconds: 2 }),
        focusSessionsPerCycle: 4
      })
    )

    timer.start()
    scheduler.advanceTime(1000)
    timer.pause()

    timer.restartShortBreak()
    scheduler.advanceTime(1000)

    const expected: TimerState = {
      remainingSeconds: 1,
      isRunning: true,
      stage: TimerStage.SHORT_BREAK,
      focusSessionsCompleted: 0
    }
    expect(timer.getState()).toEqual(expected)
  })

  it('should able to jump to long break', () => {
    const { timer, scheduler } = createTimer(
      newConfig({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 1 }),
        longBreakDuration: new Duration({ seconds: 2 }),
        focusSessionsPerCycle: 4
      })
    )

    timer.start()
    scheduler.advanceTime(3000)

    // 1st Short Break
    timer.start()
    scheduler.advanceTime(500)
    timer.pause()

    timer.restartLongBreak()
    scheduler.advanceTime(500)

    const expected: TimerState = {
      remainingSeconds: 2,
      isRunning: true,
      stage: TimerStage.LONG_BREAK,
      focusSessionsCompleted: 1
    }
    expect(timer.getState()).toEqual(expected)

    scheduler.advanceTime(1500)

    // Should reset focusSessionsCompleted after long break even number of focus completed in previous cycle is less than 4
    expect(timer.getState().stage).toBe(TimerStage.FOCUS)
    expect(timer.getState().focusSessionsCompleted).toBe(0)
  })

  it('should able to jump to focus', () => {
    const { timer } = createTimer(
      newConfig({
        focusDuration: new Duration({ seconds: 10 }),
        longBreakDuration: new Duration({ seconds: 3 }),
        focusSessionsPerCycle: 4
      })
    )

    timer.restartLongBreak()
    timer.restartFocus()

    const expected: TimerState = {
      remainingSeconds: 10,
      isRunning: true,
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 0
    }
    expect(timer.getState()).toEqual(expected)
  })

  it('should able to jump to specific focus', () => {
    const { timer } = createTimer(
      newConfig({
        focusSessionsPerCycle: 4
      })
    )

    timer.restartFocus(4) // 4th Focus
    expect(timer.getState().focusSessionsCompleted).toBe(3)

    timer.restartFocus(1)
    expect(timer.getState().focusSessionsCompleted).toBe(0)

    // Larger than 4 or Less than 0 will treat as the closest valid number

    timer.restartFocus(5)
    expect(timer.getState().focusSessionsCompleted).toBe(3)

    timer.restartFocus(0)
    expect(timer.getState().focusSessionsCompleted).toBe(0)
  })

  it('should able to jump to specific short break', () => {
    const { timer } = createTimer(
      newConfig({
        focusSessionsPerCycle: 4
      })
    )

    timer.restartShortBreak(3) // 3th Short Break
    expect(timer.getState().focusSessionsCompleted).toBe(3)

    timer.restartShortBreak(1)
    expect(timer.getState().focusSessionsCompleted).toBe(1)

    timer.restartShortBreak(4) // 4th break is Long Break. So last shortBreak is 3rd which means 3 focus completed
    expect(timer.getState().focusSessionsCompleted).toBe(3)

    timer.restartShortBreak(0)
    expect(timer.getState().focusSessionsCompleted).toBe(0)
  })

  it('should able to set state', async () => {
    const { timer } = createTimer(
      newConfig({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 1 }),
        focusSessionsPerCycle: 3
      })
    )

    const targetState: TimerState = {
      remainingSeconds: 2,
      isRunning: true,
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 1
    }

    timer.setState(targetState)

    expect(timer.getState()).toEqual(targetState)

    const targetState2: TimerState = {
      remainingSeconds: 1,
      isRunning: false,
      stage: TimerStage.SHORT_BREAK,
      focusSessionsCompleted: 2
    }
    timer.setState(targetState2)

    expect(timer.getState()).toEqual(targetState2)
  })

  it('should start the timer if newState is running', async () => {
    const { timer, scheduler } = createTimer()

    const targetState = newTestTimerState({
      remainingSeconds: 3,
      isRunning: true
    })

    const updates: TimerState[] = []
    timer.setOnTimerUpdate((state) => {
      updates.push(state)
    })

    timer.setState(targetState)
    scheduler.advanceTime(1000)

    expect(updates[updates.length - 1].remainingSeconds).toBe(2)
  })

  it('should pause the timer if newState is not running', async () => {
    const { timer, scheduler } = createTimer()

    const updates: TimerState[] = []
    timer.setOnTimerUpdate((state) => {
      updates.push(state)
    })

    timer.start()
    scheduler.advanceTime(1000)

    const targetState = newTestTimerState({
      remainingSeconds: 200,
      isRunning: false
    })

    timer.setState(targetState)
    const originalUpdatesLength = updates.length

    scheduler.advanceTime(3000)

    expect(updates.length).toBe(originalUpdatesLength)
    expect(timer.getState().remainingSeconds).toBe(200)
  })

  it('should after set onTimerStart callback, every time timer start running, it should be called', () => {
    const { timer } = createTimer()

    let triggerCount = 0
    const onTimerStart = () => {
      triggerCount++
    }

    timer.setOnTimerStart(onTimerStart)

    timer.start()
    expect(triggerCount).toBe(1)

    timer.restartFocus()
    expect(triggerCount).toBe(2)

    timer.restartShortBreak()
    expect(triggerCount).toBe(3)

    timer.restartLongBreak()
    expect(triggerCount).toBe(4)

    timer.pause()
    expect(triggerCount).toBe(4)
    timer.setState({
      remainingSeconds: 100,
      isRunning: true,
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 0
    })
    expect(triggerCount).toBe(5)
  })
})

const newConfig = TimerConfig.newTestInstance

function createTimer(timerConfig = newConfig()) {
  const scheduler = new FakePeriodicTaskScheduler()
  const timer = FocusTimer.createFake({
    scheduler,
    timerConfig
  })
  return {
    scheduler,
    timer
  }
}
