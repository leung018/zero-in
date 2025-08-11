import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FocusTimer } from '.'
import { getDateAfter } from '../../utils/date'
import { TimerConfig } from './config'
import { Duration } from './duration'
import { TimerStage } from './stage'
import { type TimerExternalState } from './state/external'
import { TimerInternalState } from './state/internal'

describe('FocusTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initial state is set correctly', () => {
    const timer = newTimer(
      newConfig({
        focusDuration: new Duration({ minutes: 10 })
      })
    )
    vi.advanceTimersByTime(1000) // if the timer is not started, the time should not change

    const expected: TimerExternalState = {
      remaining: new Duration({ minutes: 10 }),
      isRunning: false,
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 0
    }
    expect(timer.getExternalState()).toEqual(expected)
  })

  it('should round up to seconds of duration in the config', () => {
    // Since some timer publishing logic is assume that the smallest unit is second, duration in config is enforced in second precision to keep that correct

    const timer = newTimer(
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
    const timer = newTimer(
      newConfig({
        focusDuration: new Duration({ minutes: 10 }),
        focusSessionsPerCycle: 4
      })
    )
    timer.restartFocus(3)
    vi.advanceTimersByTime(1000)

    timer.setConfig(
      newConfig({
        focusDuration: new Duration({ minutes: 4, seconds: 59, milliseconds: 1 })
      })
    )

    const expected: TimerExternalState = {
      remaining: new Duration({ minutes: 5 }),
      isRunning: false,
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 0
    }
    expect(timer.getExternalState()).toEqual(expected)
  })

  it('should able to start focus', () => {
    const timer = newTimer(
      newConfig({
        focusDuration: new Duration({ minutes: 10 })
      })
    )
    timer.start()
    vi.advanceTimersByTime(1001)

    const expected: TimerExternalState = {
      remaining: new Duration({ minutes: 9, seconds: 58, milliseconds: 999 }),
      isRunning: true,
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 0
    }
    expect(timer.getExternalState()).toEqual(expected)
  })

  it("should extra call of start won't affect the timer", () => {
    const timer = newTimer(
      newConfig({
        focusDuration: new Duration({ minutes: 10 })
      })
    )

    timer.start()
    vi.advanceTimersByTime(950)
    timer.start()
    vi.advanceTimersByTime(1050)

    expect(timer.getExternalState().remaining).toEqual(new Duration({ minutes: 9, seconds: 58 }))
  })

  it('should able to pause', () => {
    const timer = newTimer(
      newConfig({
        focusDuration: new Duration({ minutes: 10 })
      })
    )
    timer.start()
    vi.advanceTimersByTime(1000)
    timer.pause()
    vi.advanceTimersByTime(1000)

    const expected: TimerExternalState = {
      remaining: new Duration({ minutes: 9, seconds: 59 }),
      isRunning: false,
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 0
    }
    expect(timer.getExternalState()).toEqual(expected)
  })

  it('should pause and start remain accuracy', () => {
    const timer = newTimer(
      newConfig({
        focusDuration: new Duration({ minutes: 10 })
      })
    )
    timer.start()
    vi.advanceTimersByTime(1259)
    timer.pause()
    timer.start()
    vi.advanceTimersByTime(1742)

    expect(timer.getExternalState().remaining).toEqual(
      new Duration({ minutes: 9, seconds: 56, milliseconds: 999 })
    )
  })

  it('should able to subscribe updates', () => {
    const timer = newTimer(
      newConfig({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 5 }),
        focusSessionsPerCycle: 4
      })
    )
    const updates: TimerExternalState[] = []
    timer.setOnTimerUpdate((update) => {
      updates.push(update)
    })

    timer.start()
    vi.advanceTimersByTime(2000)

    const expectedUpdates: TimerExternalState[] = [
      {
        remaining: new Duration({ seconds: 3 }),
        isRunning: false,
        stage: TimerStage.FOCUS,
        focusSessionsCompleted: 0
      },
      {
        remaining: new Duration({ seconds: 3 }),
        isRunning: true,
        stage: TimerStage.FOCUS,
        focusSessionsCompleted: 0
      },
      {
        remaining: new Duration({ seconds: 2 }),
        isRunning: true,
        stage: TimerStage.FOCUS,
        focusSessionsCompleted: 0
      },
      {
        remaining: new Duration({ seconds: 1 }),
        isRunning: true,
        stage: TimerStage.FOCUS,
        focusSessionsCompleted: 0
      }
    ]
    expect(updates).toEqual(expectedUpdates)

    vi.advanceTimersByTime(2000)

    expect(updates.length).toBe(5)
    const expectedLastUpdate: TimerExternalState = {
      remaining: new Duration({ seconds: 5 }),
      isRunning: false,
      stage: TimerStage.SHORT_BREAK,
      focusSessionsCompleted: 1
    }
    expect(updates[4]).toEqual(expectedLastUpdate)
  })

  it('should receive immediate update whenever timer pause', () => {
    const timer = newTimer(
      newConfig({
        focusDuration: new Duration({ minutes: 10 })
      })
    )
    const updates: TimerExternalState[] = []
    timer.setOnTimerUpdate((update) => {
      updates.push(update)
    })

    timer.start()
    vi.advanceTimersByTime(2000)

    const lastUpdatesLength = updates.length

    timer.pause()

    expect(updates[lastUpdatesLength].isRunning).toBe(false)
    expect(updates[lastUpdatesLength].remaining).toEqual(new Duration({ minutes: 9, seconds: 58 }))
  })

  it('should after pause and start again, subscription can receive updates properly', () => {
    const timer = newTimer(
      newConfig({
        focusDuration: new Duration({ minutes: 10 })
      })
    )
    const updates: TimerExternalState[] = []
    timer.setOnTimerUpdate((update) => {
      updates.push(update)
    })

    timer.start()
    vi.advanceTimersByTime(1450)

    timer.pause()

    const lastUpdatesLength = updates.length

    timer.start()
    vi.advanceTimersByTime(550)

    expect(updates[lastUpdatesLength].remaining).toEqual(
      new Duration({ minutes: 9, seconds: 58, milliseconds: 550 }) // Whenever timer is started, it will publish the current state
    )
    expect(updates[lastUpdatesLength + 1].remaining).toEqual(
      new Duration({ minutes: 9, seconds: 58 }) // After 550ms since restart, the remaining time should be 9:58 and it should be published
    )
  })

  it('should receive immediate update whenever subscribe', () => {
    const timer = newTimer(
      newConfig({
        focusDuration: new Duration({ minutes: 10 })
      })
    )
    const updates: TimerExternalState[] = []
    timer.start()
    vi.advanceTimersByTime(1100)

    timer.setOnTimerUpdate((update) => {
      updates.push(update)
    })

    // although the update will be published every 1000ms, should receive immediate response when subscribe
    expect(updates.length).toBe(1)
    expect(updates[0].remaining).toEqual(
      new Duration({ minutes: 9, seconds: 58, milliseconds: 900 })
    )
  })
  it('should able to trigger callback when stage transit', async () => {
    const timer = newTimer(
      newConfig({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 1 }),
        focusSessionsPerCycle: 3
      })
    )
    let lastStage: TimerStage | null = null
    let currentStage: TimerStage | null = null
    let lastSessionStartTime: Date | null = null
    timer.setOnStageCompleted(({ lastStage: stage, lastSessionStartTime: time }) => {
      lastStage = stage
      currentStage = timer.getExternalState().stage
      lastSessionStartTime = time ?? null
    })

    const startTime = new Date()
    timer.start()
    vi.advanceTimersByTime(3000)

    expect(lastStage).toBe(TimerStage.FOCUS)
    expect(currentStage).toBe(TimerStage.SHORT_BREAK)
    expect(lastSessionStartTime).toEqual(startTime)

    timer.start()
    vi.advanceTimersByTime(1000)

    expect(lastStage).toBe(TimerStage.SHORT_BREAK)
    expect(currentStage).toBe(TimerStage.FOCUS)
  })

  it('should switch to break after focus duration is passed', () => {
    const timer = newTimer(
      newConfig({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 1 })
      })
    )
    timer.start()
    vi.advanceTimersByTime(3000)

    const expected: TimerExternalState = {
      remaining: new Duration({ seconds: 1 }),
      isRunning: false,
      stage: TimerStage.SHORT_BREAK,
      focusSessionsCompleted: 1
    }
    expect(timer.getExternalState()).toEqual(expected)
  })

  it('should switch back to focus after break duration is passed', () => {
    const timer = newTimer(
      newConfig({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 1 })
      })
    )
    timer.start()
    vi.advanceTimersByTime(3000)
    timer.start()
    vi.advanceTimersByTime(1000)

    const expected: TimerExternalState = {
      remaining: new Duration({ seconds: 3 }),
      isRunning: false,
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 1
    }
    expect(timer.getExternalState()).toEqual(expected)
  })

  it('should start long break after finish all focus sessions in that cycle', () => {
    const timer = newTimer(
      newConfig({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 1 }),
        longBreakDuration: new Duration({ seconds: 2 }),
        focusSessionsPerCycle: 2
      })
    )

    // 1st Focus
    timer.start()
    vi.advanceTimersByTime(3000)

    // Short Break
    timer.start()
    vi.advanceTimersByTime(1000)

    // 2nd Focus
    timer.start()
    vi.advanceTimersByTime(3000)

    // Long Break
    const expected: TimerExternalState = {
      remaining: new Duration({ seconds: 2 }),
      isRunning: false,
      stage: TimerStage.LONG_BREAK,
      focusSessionsCompleted: 2
    }
    expect(timer.getExternalState()).toEqual(expected)
  })

  it('should reset the cycle after long break', () => {
    const timer = newTimer(
      newConfig({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 1 }),
        longBreakDuration: new Duration({ seconds: 2 }),
        focusSessionsPerCycle: 2
      })
    )

    // 1st Focus
    timer.start()
    vi.advanceTimersByTime(3000)

    // Short Break
    timer.start()
    vi.advanceTimersByTime(1000)

    // 2nd Focus
    timer.start()
    vi.advanceTimersByTime(3000)

    // Long Break
    timer.start()
    vi.advanceTimersByTime(2000)

    // After Long Break, it should reset to Focus
    let expected: TimerExternalState = {
      remaining: new Duration({ seconds: 3 }),
      isRunning: false,
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 0
    }
    expect(timer.getExternalState()).toEqual(expected)

    // 1st Focus
    timer.start()
    vi.advanceTimersByTime(3000)

    // Short Break
    timer.start()
    vi.advanceTimersByTime(1000)

    // 2rd Focus
    timer.start()
    vi.advanceTimersByTime(3000)

    // Long Break again
    expected = {
      remaining: new Duration({ seconds: 2 }),
      isRunning: false,
      stage: TimerStage.LONG_BREAK,
      focusSessionsCompleted: 2
    }
    expect(timer.getExternalState()).toEqual(expected)
  })

  it('should able to jump to short break', () => {
    const timer = newTimer(
      newConfig({
        focusDuration: new Duration({ seconds: 10 }),
        shortBreakDuration: new Duration({ seconds: 2 }),
        focusSessionsPerCycle: 4
      })
    )

    timer.start()
    vi.advanceTimersByTime(1000)
    timer.pause()

    timer.restartShortBreak()
    vi.advanceTimersByTime(1000)

    const expected: TimerExternalState = {
      remaining: new Duration({ seconds: 1 }),
      isRunning: true,
      stage: TimerStage.SHORT_BREAK,
      focusSessionsCompleted: 0
    }
    expect(timer.getExternalState()).toEqual(expected)
  })

  it('should able to jump to long break', () => {
    const timer = newTimer(
      newConfig({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 1 }),
        longBreakDuration: new Duration({ seconds: 2 }),
        focusSessionsPerCycle: 4
      })
    )

    timer.start()
    vi.advanceTimersByTime(3000)

    // 1st Short Break
    timer.start()
    vi.advanceTimersByTime(500)
    timer.pause()

    timer.restartLongBreak()
    vi.advanceTimersByTime(500)

    const expected: TimerExternalState = {
      remaining: new Duration({ seconds: 1, milliseconds: 500 }),
      isRunning: true,
      stage: TimerStage.LONG_BREAK,
      focusSessionsCompleted: 1
    }
    expect(timer.getExternalState()).toEqual(expected)
  })

  it('should reset focusSessionsCompleted after long break', () => {
    const timer = newTimer(
      newConfig({
        focusDuration: new Duration({ seconds: 3 }),
        longBreakDuration: new Duration({ seconds: 2 }),
        focusSessionsPerCycle: 4
      })
    )

    // Complete 1 focus session
    timer.start()
    vi.advanceTimersByTime(3000)

    timer.restartLongBreak()
    vi.advanceTimersByTime(2000)

    expect(timer.getExternalState().stage).toBe(TimerStage.FOCUS)
    expect(timer.getExternalState().focusSessionsCompleted).toBe(0)
  })

  it('should able to jump to focus', () => {
    const timer = newTimer(
      newConfig({
        focusDuration: new Duration({ seconds: 10 }),
        longBreakDuration: new Duration({ seconds: 3 }),
        focusSessionsPerCycle: 4
      })
    )

    timer.restartLongBreak()
    timer.restartFocus()

    const expected: TimerExternalState = {
      remaining: new Duration({ seconds: 10 }),
      isRunning: true,
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 0
    }
    expect(timer.getExternalState()).toEqual(expected)
  })

  it('should able to jump to specific focus', () => {
    const timer = newTimer(
      newConfig({
        focusSessionsPerCycle: 4
      })
    )

    timer.restartFocus(4) // 4th Focus
    expect(timer.getExternalState().focusSessionsCompleted).toBe(3)

    timer.restartFocus(1)
    expect(timer.getExternalState().focusSessionsCompleted).toBe(0)

    // Larger than 4 or Less than 0 will treat as the closest valid number

    timer.restartFocus(5)
    expect(timer.getExternalState().focusSessionsCompleted).toBe(3)

    timer.restartFocus(0)
    expect(timer.getExternalState().focusSessionsCompleted).toBe(0)
  })

  it('should able to jump to specific short break', () => {
    const timer = newTimer(
      newConfig({
        focusSessionsPerCycle: 4
      })
    )

    timer.restartShortBreak(3) // 3th Short Break
    expect(timer.getExternalState().focusSessionsCompleted).toBe(3)

    timer.restartShortBreak(1)
    expect(timer.getExternalState().focusSessionsCompleted).toBe(1)

    timer.restartShortBreak(4) // 4th break is Long Break. So last shortBreak is 3rd which means 3 focus completed
    expect(timer.getExternalState().focusSessionsCompleted).toBe(3)

    timer.restartShortBreak(0)
    expect(timer.getExternalState().focusSessionsCompleted).toBe(0)
  })

  it('should able to set internal state', async () => {
    const timer = newTimer(
      newConfig({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 1 }),
        focusSessionsPerCycle: 3
      })
    )

    // State that is running
    const internalState1: TimerInternalState = TimerInternalState.newRunningState({
      sessionStartTime: new Date(),
      remaining: new Duration({ seconds: 2 }),
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 1
    })
    const expectedExternalState: TimerExternalState = {
      remaining: new Duration({ seconds: 2 }),
      isRunning: true,
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 1
    }
    timer.setInternalState(internalState1)

    expect(timer.getExternalState()).toEqual(expectedExternalState)
    expect(timer.getInternalState()).toEqual(internalState1)

    // State that is paused
    const internalState2: TimerInternalState = TimerInternalState.newPausedState({
      remaining: new Duration({ seconds: 1 }),
      stage: TimerStage.SHORT_BREAK,
      focusSessionsCompleted: 2
    }).copyWith({
      sessionStartTime: internalState1.sessionStartTime
    })
    const expectedExternalState2: TimerExternalState = {
      remaining: new Duration({ seconds: 1 }),
      isRunning: false,
      stage: TimerStage.SHORT_BREAK,
      focusSessionsCompleted: 2
    }
    timer.setInternalState(internalState2)

    expect(timer.getExternalState()).toEqual(expectedExternalState2)
    expect(timer.getInternalState()).toEqual(internalState2)
  })

  it('should start the timer if new state is running', async () => {
    const timer = newTimer()

    const updates: TimerExternalState[] = []
    timer.setOnTimerUpdate((state) => {
      updates.push(state)
    })

    timer.setInternalState(
      TimerInternalState.newTestInstance({
        pausedAt: undefined,
        endAt: getDateAfter({ duration: new Duration({ seconds: 3 }) })
      })
    )
    vi.advanceTimersByTime(1000)

    expect(updates[updates.length - 1].remaining).toEqual(new Duration({ seconds: 2 }))
  })

  it('should pause the timer if new state is not running', async () => {
    const timer = newTimer()

    const updates: TimerExternalState[] = []
    timer.setOnTimerUpdate((state) => {
      updates.push(state)
    })

    timer.start()
    vi.advanceTimersByTime(1000)

    timer.setInternalState(
      TimerInternalState.newTestInstance({
        pausedAt: new Date(),
        endAt: getDateAfter({ duration: new Duration({ seconds: 200 }) })
      })
    )
    const originalUpdatesLength = updates.length

    vi.advanceTimersByTime(3000)

    expect(updates.length).toBe(originalUpdatesLength)
    expect(timer.getExternalState().remaining).toEqual(new Duration({ seconds: 200 }))
  })

  it('should record sessionStartTime when timer start focus', () => {
    const now = new Date()
    vi.setSystemTime(now)

    const timer = newTimer(
      newConfig({
        focusDuration: new Duration({ minutes: 10 })
      })
    )
    timer.start()

    vi.advanceTimersByTime(1001)
    timer.pause()
    timer.start() // Extra start won't affect the sessionStartTime. sessionStartTime only consider the initial start

    expect(timer.getInternalState().sessionStartTime).toEqual(now)
  })

  it('should update sessionStartTime when restart focus', () => {
    const firstSessionStartTime = new Date()
    vi.setSystemTime(firstSessionStartTime)

    const timer = newTimer(
      newConfig({
        focusDuration: new Duration({ minutes: 10 })
      })
    )
    timer.start()

    vi.advanceTimersByTime(1001)
    const restartTime = new Date()
    timer.restartFocus()

    expect(timer.getInternalState().sessionStartTime).toEqual(restartTime)
  })

  it('should after set onTimerStart callback, every time timer start running, it should be called', () => {
    const timer = newTimer()

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
    timer.setInternalState(
      TimerInternalState.newTestInstance({
        pausedAt: undefined
      })
    )
    expect(triggerCount).toBe(5)
  })
})

const newConfig = TimerConfig.newTestInstance

function newTimer(timerConfig = newConfig()) {
  return FocusTimer.create(timerConfig)
}
