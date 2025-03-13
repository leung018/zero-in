import { describe, expect, it } from 'vitest'
import { PomodoroTimer, type PomodoroTimerState } from './timer'
import { Duration } from './duration'
import { PomodoroStage } from './stage'
import { FakePeriodicTaskScheduler } from '../../infra/scheduler'
import { flushPromises } from '@vue/test-utils'
import { PomodoroRecordStorageService } from './record/storage'

describe('PomodoroTimer', () => {
  it('should initial state is set correctly', () => {
    const { timer, scheduler } = createTimer({
      focusDuration: new Duration({ minutes: 10 })
    })
    scheduler.advanceTime(1000) // if the timer is not started, the time should not change

    expect(timer.getState()).toEqual({
      remainingSeconds: new Duration({ minutes: 10 }).remainingSeconds(),
      isRunning: false,
      stage: PomodoroStage.FOCUS,
      numOfPomodoriCompleted: 0
    })
  })

  it('should round up to seconds of duration in the config', () => {
    // Since some timer publishing logic is assume that the smallest unit is second, duration in config is enforced in second precision to keep that correct

    const { timer } = createTimer({
      focusDuration: new Duration({ seconds: 10, milliseconds: 1 }),
      shortBreakDuration: new Duration({ seconds: 3, milliseconds: 1 }),
      longBreakDuration: new Duration({ seconds: 2, milliseconds: 1 }),
      numOfPomodoriPerCycle: 5
    })

    expect(timer.getConfig()).toEqual({
      focusDuration: new Duration({ seconds: 11 }),
      shortBreakDuration: new Duration({ seconds: 4 }),
      longBreakDuration: new Duration({ seconds: 3 }),
      numOfPomodoriPerCycle: 5
    })
  })

  it('should able to start focus', () => {
    const { timer, scheduler } = createTimer({
      focusDuration: new Duration({ minutes: 10 })
    })
    timer.start()
    scheduler.advanceTime(1001)

    expect(timer.getState()).toEqual({
      remainingSeconds: new Duration({ minutes: 9, seconds: 59 }).remainingSeconds(),
      isRunning: true,
      stage: PomodoroStage.FOCUS,
      numOfPomodoriCompleted: 0
    })
  })

  it("should extra call of start won't affect the timer", () => {
    const { timer, scheduler } = createTimer({
      focusDuration: new Duration({ minutes: 10 })
    })

    timer.start()
    scheduler.advanceTime(950)
    timer.start()
    scheduler.advanceTime(1050)

    expect(timer.getState().remainingSeconds).toEqual(
      new Duration({ minutes: 9, seconds: 58 }).remainingSeconds()
    )
  })

  it('should able to pause', () => {
    const { timer, scheduler } = createTimer({
      focusDuration: new Duration({ minutes: 10 })
    })
    timer.start()
    scheduler.advanceTime(1000)
    timer.pause()
    scheduler.advanceTime(1000)

    expect(timer.getState()).toEqual({
      remainingSeconds: new Duration({ minutes: 9, seconds: 59 }).remainingSeconds(),
      isRunning: false,
      stage: PomodoroStage.FOCUS,
      numOfPomodoriCompleted: 0
    })
  })

  it('should pause and start remain accuracy to 100ms', () => {
    const { timer, scheduler } = createTimer({
      focusDuration: new Duration({ minutes: 10 })
    })
    timer.start()
    scheduler.advanceTime(1200)
    timer.pause()
    timer.start()
    scheduler.advanceTime(1800)

    expect(timer.getState().remainingSeconds).toEqual(
      new Duration({ minutes: 9, seconds: 57 }).remainingSeconds()
    )
  })

  it('should able to subscribe updates', () => {
    const { timer, scheduler } = createTimer({
      focusDuration: new Duration({ seconds: 3 }),
      shortBreakDuration: new Duration({ seconds: 5 }),
      numOfPomodoriPerCycle: 4
    })
    const updates: PomodoroTimerState[] = []
    timer.subscribeTimerState((update) => {
      updates.push(update)
    })

    timer.start()
    scheduler.advanceTime(2000)

    expect(updates).toEqual([
      {
        remainingSeconds: new Duration({ seconds: 3 }).remainingSeconds(),
        isRunning: false,
        stage: PomodoroStage.FOCUS,
        numOfPomodoriCompleted: 0
      },
      {
        remainingSeconds: new Duration({ seconds: 3 }).remainingSeconds(),
        isRunning: true,
        stage: PomodoroStage.FOCUS,
        numOfPomodoriCompleted: 0
      },
      {
        remainingSeconds: new Duration({ seconds: 2 }).remainingSeconds(),
        isRunning: true,
        stage: PomodoroStage.FOCUS,
        numOfPomodoriCompleted: 0
      },
      {
        remainingSeconds: new Duration({ seconds: 1 }).remainingSeconds(),
        isRunning: true,
        stage: PomodoroStage.FOCUS,
        numOfPomodoriCompleted: 0
      }
    ])

    scheduler.advanceTime(2000)

    expect(updates.length).toBe(5)
    expect(updates[4]).toEqual({
      remainingSeconds: new Duration({ seconds: 5 }).remainingSeconds(),
      isRunning: false,
      stage: PomodoroStage.SHORT_BREAK,
      numOfPomodoriCompleted: 1
    })
  })

  it('should receive immediate update whenever timer pause', () => {
    const { timer, scheduler } = createTimer({
      focusDuration: new Duration({ minutes: 10 })
    })
    const updates: PomodoroTimerState[] = []
    timer.subscribeTimerState((update) => {
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
    const { timer, scheduler } = createTimer({
      focusDuration: new Duration({ minutes: 10 })
    })
    const updates: PomodoroTimerState[] = []
    timer.subscribeTimerState((update) => {
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
    const { timer, scheduler } = createTimer({
      focusDuration: new Duration({ minutes: 10 })
    })
    const updates: PomodoroTimerState[] = []
    timer.start()
    scheduler.advanceTime(1005)

    timer.subscribeTimerState((update) => {
      updates.push(update)
    })

    // although the update will be published every 1000ms, should receive immediate response when subscribe
    expect(updates.length).toBe(1)
    expect(updates[0].remainingSeconds).toEqual(
      new Duration({ minutes: 9, seconds: 59 }).remainingSeconds()
    )
  })

  it('should able to unsubscribe updates', () => {
    const { timer, scheduler } = createTimer({
      focusDuration: new Duration({ minutes: 10 })
    })
    const updates1: PomodoroTimerState[] = []
    const updates2: PomodoroTimerState[] = []
    timer.subscribeTimerState((update) => {
      updates1.push(update)
    })
    const subscriptionId2 = timer.subscribeTimerState((update) => {
      updates2.push(update)
    })

    timer.unsubscribeTimerState(subscriptionId2)

    timer.start()
    scheduler.advanceTime(250)

    expect(updates2.length).toBeLessThan(updates1.length)
  })

  it('should getSubscriptionCount is reflecting number of subscription', () => {
    const { timer } = createTimer({})
    expect(timer.getSubscriptionCount()).toBe(0)

    const subscriptionId = timer.subscribeTimerState(() => {})
    timer.subscribeTimerState(() => {})

    expect(timer.getSubscriptionCount()).toBe(2)

    timer.unsubscribeTimerState(subscriptionId)

    expect(timer.getSubscriptionCount()).toBe(1)
  })

  it('should able to trigger callback when stage transit', async () => {
    const { timer, scheduler } = createTimer({
      focusDuration: new Duration({ seconds: 3 }),
      shortBreakDuration: new Duration({ seconds: 1 })
    })
    let triggeredCount = 0
    timer.setOnStageComplete(() => {
      triggeredCount++
    })

    timer.start()
    scheduler.advanceTime(3000)
    await flushPromises()

    expect(triggeredCount).toBe(1)

    timer.start()
    scheduler.advanceTime(1000)
    await flushPromises()

    expect(triggeredCount).toBe(2)
  })

  it('should switch to break after focus duration is passed', () => {
    const { timer, scheduler } = createTimer({
      focusDuration: new Duration({ seconds: 3 }),
      shortBreakDuration: new Duration({ seconds: 1 })
    })
    timer.start()
    scheduler.advanceTime(3000)

    expect(timer.getState()).toEqual({
      remainingSeconds: new Duration({ seconds: 1 }).remainingSeconds(),
      isRunning: false,
      stage: PomodoroStage.SHORT_BREAK,
      numOfPomodoriCompleted: 1
    })
  })

  it('should switch back to focus after break duration is passed', () => {
    const { timer, scheduler } = createTimer({
      focusDuration: new Duration({ seconds: 3 }),
      shortBreakDuration: new Duration({ seconds: 1 })
    })
    timer.start()
    scheduler.advanceTime(3000)
    timer.start()
    scheduler.advanceTime(1000)

    expect(timer.getState()).toEqual({
      remainingSeconds: new Duration({ seconds: 3 }).remainingSeconds(),
      isRunning: false,
      stage: PomodoroStage.FOCUS,
      numOfPomodoriCompleted: 1
    })
  })

  it('should start long break after number of pomodori per cycle is passed', () => {
    const { timer, scheduler } = createTimer({
      focusDuration: new Duration({ seconds: 3 }),
      shortBreakDuration: new Duration({ seconds: 1 }),
      longBreakDuration: new Duration({ seconds: 2 }),
      numOfPomodoriPerCycle: 2
    })

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
    expect(timer.getState()).toEqual({
      remainingSeconds: new Duration({ seconds: 2 }).remainingSeconds(),
      isRunning: false,
      stage: PomodoroStage.LONG_BREAK,
      numOfPomodoriCompleted: 2
    })
  })

  it('should reset the cycle after long break', () => {
    const { timer, scheduler } = createTimer({
      focusDuration: new Duration({ seconds: 3 }),
      shortBreakDuration: new Duration({ seconds: 1 }),
      longBreakDuration: new Duration({ seconds: 2 }),
      numOfPomodoriPerCycle: 2
    })

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
    expect(timer.getState()).toEqual({
      remainingSeconds: new Duration({ seconds: 3 }).remainingSeconds(),
      isRunning: false,
      stage: PomodoroStage.FOCUS,
      numOfPomodoriCompleted: 0
    })

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
    expect(timer.getState()).toEqual({
      remainingSeconds: new Duration({ seconds: 2 }).remainingSeconds(),
      isRunning: false,
      stage: PomodoroStage.LONG_BREAK,
      numOfPomodoriCompleted: 2
    })
  })

  it('should able to jump to short break', () => {
    const { timer, scheduler } = createTimer({
      focusDuration: new Duration({ seconds: 10 }),
      shortBreakDuration: new Duration({ seconds: 2 }),
      numOfPomodoriPerCycle: 4
    })

    timer.start()
    scheduler.advanceTime(1000)
    timer.pause()

    timer.restartShortBreak()
    scheduler.advanceTime(1000)

    expect(timer.getState()).toEqual({
      remainingSeconds: new Duration({ seconds: 1 }).remainingSeconds(),
      isRunning: true,
      stage: PomodoroStage.SHORT_BREAK,
      numOfPomodoriCompleted: 0
    })
  })

  it('should able to jump to long break', () => {
    const { timer, scheduler } = createTimer({
      focusDuration: new Duration({ seconds: 3 }),
      shortBreakDuration: new Duration({ seconds: 1 }),
      longBreakDuration: new Duration({ seconds: 2 }),
      numOfPomodoriPerCycle: 4
    })

    timer.start()
    scheduler.advanceTime(3000)

    // 1st Short Break
    timer.start()
    scheduler.advanceTime(500)
    timer.pause()

    timer.restartLongBreak()
    scheduler.advanceTime(500)

    expect(timer.getState()).toEqual({
      remainingSeconds: new Duration({ seconds: 1, milliseconds: 500 }).remainingSeconds(),
      isRunning: true,
      stage: PomodoroStage.LONG_BREAK,
      numOfPomodoriCompleted: 1
    })

    scheduler.advanceTime(1500)

    // Should reset numOfPomodoriCompleted after long break even number of focus completed in previous cycle is less than 4
    expect(timer.getState().stage).toBe(PomodoroStage.FOCUS)
    expect(timer.getState().numOfPomodoriCompleted).toBe(0)
  })

  it('should able to jump to focus', () => {
    const { timer } = createTimer({
      focusDuration: new Duration({ seconds: 10 }),
      longBreakDuration: new Duration({ seconds: 3 }),
      numOfPomodoriPerCycle: 4
    })

    timer.restartLongBreak()
    timer.restartFocus()

    expect(timer.getState()).toEqual({
      remainingSeconds: new Duration({ seconds: 10 }).remainingSeconds(),
      isRunning: true,
      stage: PomodoroStage.FOCUS,
      numOfPomodoriCompleted: 0
    })
  })

  it('should able to jump to specific focus', () => {
    const { timer } = createTimer({
      numOfPomodoriPerCycle: 4
    })

    timer.restartFocus(4) // 4th Focus
    expect(timer.getState().numOfPomodoriCompleted).toBe(3)

    timer.restartFocus(1)
    expect(timer.getState().numOfPomodoriCompleted).toBe(0)

    // Larger than 4 or Less than 0 will treat as the closest valid number

    timer.restartFocus(5)
    expect(timer.getState().numOfPomodoriCompleted).toBe(3)

    timer.restartFocus(0)
    expect(timer.getState().numOfPomodoriCompleted).toBe(0)
  })

  it('should able to jump to specific short break', () => {
    const { timer } = createTimer({
      numOfPomodoriPerCycle: 4
    })

    timer.restartShortBreak(3) // 3th Short Break
    expect(timer.getState().numOfPomodoriCompleted).toBe(3)

    timer.restartShortBreak(1)
    expect(timer.getState().numOfPomodoriCompleted).toBe(1)

    timer.restartShortBreak(4) // 4th break is Long Break. So last shortBreak is 3rd which means 3 focus completed
    expect(timer.getState().numOfPomodoriCompleted).toBe(3)

    timer.restartShortBreak(0)
    expect(timer.getState().numOfPomodoriCompleted).toBe(0)
  })

  it('should save the pomodoro record after focus is completed', async () => {
    const { timer, scheduler, pomodoroRecordStorageService } = createTimer({
      focusDuration: new Duration({ seconds: 3 }),
      shortBreakDuration: new Duration({ seconds: 1 }),
      numOfPomodoriPerCycle: 3
    })

    // Focus
    timer.start()
    scheduler.advanceTime(3000)
    await flushPromises()

    const pomodoroRecords = await pomodoroRecordStorageService.getAll()
    expect(pomodoroRecords.length).toBe(1)
    expect(pomodoroRecords[0].completedAt).toBeInstanceOf(Date)

    // Break
    timer.start()
    scheduler.advanceTime(1000)
    await flushPromises()

    expect((await pomodoroRecordStorageService.getAll()).length).toBe(1)
  })

  it('should able to set state', async () => {
    const { timer } = createTimer({
      focusDuration: new Duration({ seconds: 3 }),
      shortBreakDuration: new Duration({ seconds: 1 }),
      numOfPomodoriPerCycle: 3
    })

    const targetState: PomodoroTimerState = {
      remainingSeconds: new Duration({ seconds: 2 }).remainingSeconds(),
      isRunning: true,
      stage: PomodoroStage.FOCUS,
      numOfPomodoriCompleted: 1
    }

    timer.setState(targetState)

    expect(timer.getState()).toEqual(targetState)
  })
})

function createTimer({
  focusDuration = new Duration({ minutes: 25 }),
  shortBreakDuration = new Duration({ minutes: 5 }),
  longBreakDuration = new Duration({ minutes: 15 }),
  numOfPomodoriPerCycle = 4
} = {}) {
  const scheduler = new FakePeriodicTaskScheduler()
  const pomodoroRecordStorageService = PomodoroRecordStorageService.createFake()
  const timer = PomodoroTimer.createFake({
    scheduler,
    pomodoroRecordStorageService,
    timerConfig: {
      focusDuration,
      shortBreakDuration,
      longBreakDuration,
      numOfPomodoriPerCycle
    }
  })
  return {
    pomodoroRecordStorageService,
    scheduler,
    timer
  }
}
