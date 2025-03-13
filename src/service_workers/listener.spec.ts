import { describe, expect, it } from 'vitest'
import { WorkRequestName } from './request'
import { type Badge, type BadgeColor } from '../infra/badge'
import { Duration } from '../domain/pomodoro/duration'
import { flushPromises } from '@vue/test-utils'
import config from '../config'
import { startBackgroundListener } from '../test_utils/listener'
import { newTestPomodoroTimerConfig } from '../domain/pomodoro/config'
import { TimerStateStorageService } from '../domain/pomodoro/storage'
import type { PomodoroTimerState } from '../domain/pomodoro/timer'
import { PomodoroStage } from '../domain/pomodoro/stage'

// Noted that below doesn't cover all the behaviors of BackgroundListener. Some of that is covered in other vue component tests.
describe('BackgroundListener', () => {
  it('should remove subscription when disconnect fired', async () => {
    const { timer, clientPort } = await startListener()

    const initialSubscriptionCount = timer.getSubscriptionCount()

    clientPort.send({ name: WorkRequestName.LISTEN_TO_TIMER })

    expect(timer.getSubscriptionCount()).toBe(initialSubscriptionCount + 1)

    clientPort.disconnect()

    expect(timer.getSubscriptionCount()).toBe(initialSubscriptionCount)
  })

  it('should display badge when the timer is started', async () => {
    const { badgeDisplayService, scheduler, clientPort } = await startListener(
      newTestPomodoroTimerConfig({
        focusDuration: new Duration({ minutes: 25 })
      })
    )

    expect(badgeDisplayService.getDisplayedBadge()).toBe(null)

    clientPort.send({ name: WorkRequestName.START_TIMER })

    const focusBadgeColor: BadgeColor = config.getBadgeColorConfig().focusBadgeColor

    let expected: Badge = {
      text: '25',
      color: focusBadgeColor
    }
    expect(badgeDisplayService.getDisplayedBadge()).toEqual(expected)

    scheduler.advanceTime(1000)
    await flushPromises()

    // remaining 24:59 still display 25
    expect(badgeDisplayService.getDisplayedBadge()).toEqual(expected)

    scheduler.advanceTime(59000)
    await flushPromises()

    // change to 24 only when remaining 24:00
    expected = {
      text: '24',
      color: focusBadgeColor
    }
    expect(badgeDisplayService.getDisplayedBadge()).toEqual(expected)
  })

  it('should remove badge when the timer is paused', async () => {
    const { badgeDisplayService, clientPort } = await startListener()

    clientPort.send({ name: WorkRequestName.START_TIMER })

    expect(badgeDisplayService.getDisplayedBadge()).not.toBeNull()

    clientPort.send({ name: WorkRequestName.PAUSE_TIMER })

    expect(badgeDisplayService.getDisplayedBadge()).toBeNull()
  })

  it('should remove badge when the timer is finished', async () => {
    const { badgeDisplayService, scheduler, clientPort } = await startListener(
      newTestPomodoroTimerConfig({
        focusDuration: new Duration({ seconds: 1 })
      })
    )

    clientPort.send({ name: WorkRequestName.START_TIMER })
    scheduler.advanceTime(1000)

    expect(badgeDisplayService.getDisplayedBadge()).toBeNull()
  })

  it('should display short break badge properly', async () => {
    const { badgeDisplayService, scheduler, clientPort } = await startListener(
      newTestPomodoroTimerConfig({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ minutes: 2 }),
        longBreakDuration: new Duration({ minutes: 4 }),
        numOfPomodoriPerCycle: 2
      })
    )

    clientPort.send({ name: WorkRequestName.START_TIMER })
    scheduler.advanceTime(3000)

    // start short break
    clientPort.send({ name: WorkRequestName.START_TIMER })

    const expected: Badge = {
      text: '2',
      color: config.getBadgeColorConfig().breakBadgeColor
    }
    expect(badgeDisplayService.getDisplayedBadge()).toEqual(expected)
  })

  it('should display long break badge properly', async () => {
    const { badgeDisplayService, scheduler, clientPort } = await startListener(
      newTestPomodoroTimerConfig({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ minutes: 2 }),
        longBreakDuration: new Duration({ minutes: 4 }),
        numOfPomodoriPerCycle: 1
      })
    )

    clientPort.send({ name: WorkRequestName.START_TIMER })
    scheduler.advanceTime(3000)

    // start long break
    clientPort.send({ name: WorkRequestName.START_TIMER })

    const expected: Badge = {
      text: '4',
      color: config.getBadgeColorConfig().breakBadgeColor
    }
    expect(badgeDisplayService.getDisplayedBadge()).toEqual(expected)
  })

  it('should trigger reminderService when time is up', async () => {
    const { reminderService, scheduler, clientPort } = await startListener(
      newTestPomodoroTimerConfig({
        focusDuration: new Duration({ seconds: 3 })
      })
    )

    clientPort.send({ name: WorkRequestName.START_TIMER })
    scheduler.advanceTime(3000)

    expect(reminderService.getTriggerCount()).toBe(1)
  })

  it('should back up update to storage', async () => {
    const { timerStateStorageService, scheduler, clientPort, timer } = await startListener(
      newTestPomodoroTimerConfig({
        focusDuration: new Duration({ seconds: 3 })
      })
    )

    clientPort.send({ name: WorkRequestName.START_TIMER })
    scheduler.advanceTime(1000)

    expect(await timerStateStorageService.get()).toEqual(timer.getState())

    clientPort.send({ name: WorkRequestName.PAUSE_TIMER })

    expect(await timerStateStorageService.get()).toEqual(timer.getState())
  })

  it('should restore timer state from storage', async () => {
    const timerStateStorageService = TimerStateStorageService.createFake()
    const targetUpdate: PomodoroTimerState = {
      remainingSeconds: 1000,
      isRunning: true,
      stage: PomodoroStage.FOCUS,
      numOfPomodoriCompleted: 1
    }
    await timerStateStorageService.save(targetUpdate)

    const { timer } = await startListener(
      newTestPomodoroTimerConfig({
        focusDuration: new Duration({ seconds: 3 }),
        numOfPomodoriPerCycle: 2
      }),
      timerStateStorageService
    )
    await flushPromises()

    expect(timer.getState()).toEqual(targetUpdate)
  })
})

async function startListener(
  timerConfig = newTestPomodoroTimerConfig(),
  timerStateStorageService = TimerStateStorageService.createFake()
) {
  const { timer, badgeDisplayService, communicationManager, scheduler, reminderService } =
    await startBackgroundListener({
      timerConfig,
      timerStateStorageService
    })

  return {
    timer,
    badgeDisplayService,
    timerStateStorageService,
    clientPort: communicationManager.clientConnect(),
    scheduler,
    reminderService
  }
}
