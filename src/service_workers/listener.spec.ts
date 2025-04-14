import { describe, expect, it } from 'vitest'
import { WorkRequestName } from './request'
import { type Badge, type BadgeColor } from '../infra/badge'
import { Duration } from '../domain/pomodoro/duration'
import config from '../config'
import { startBackgroundListener } from '../test_utils/listener'
import { TimerConfig } from '../domain/pomodoro/config'
import { TimerStateStorageService } from '../domain/pomodoro/storage'
import type { TimerState } from '../domain/pomodoro/timer'
import { PomodoroStage } from '../domain/pomodoro/stage'
import { flushPromises } from '@vue/test-utils'
import type { FocusSessionRecord } from '../domain/pomodoro/record'
import { newTestNotificationSetting } from '../domain/notification_setting'

// Noted that below doesn't cover all the behaviors of BackgroundListener. Some of that is covered in other vue component tests.
describe('BackgroundListener', () => {
  it('should remove timer state subscription when disconnect fired', async () => {
    const { timer, clientPort } = await startListener()

    const initialSubscriptionCount = timer.getTimerStateSubscriptionCount()

    clientPort.send({ name: WorkRequestName.LISTEN_TO_TIMER })

    expect(timer.getTimerStateSubscriptionCount()).toBe(initialSubscriptionCount + 1)

    clientPort.disconnect()

    expect(timer.getTimerStateSubscriptionCount()).toBe(initialSubscriptionCount)
  })

  it('should save the pomodoro record after focus is completed', async () => {
    const { scheduler, clientPort, focusSessionRecordStorageService } = await startListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 1 })
      })
    })

    // Focus
    clientPort.send({ name: WorkRequestName.START_TIMER })
    scheduler.advanceTime(3000)
    await flushPromises()

    const focusSessionRecords = await focusSessionRecordStorageService.getAll()
    expect(focusSessionRecords.length).toBe(1)
    expect(focusSessionRecords[0].completedAt).toBeInstanceOf(Date)

    // Break
    clientPort.send({ name: WorkRequestName.START_TIMER })
    scheduler.advanceTime(1000)
    await flushPromises()

    expect((await focusSessionRecordStorageService.getAll()).length).toBe(1)
  })

  it('should house keep the pomodoro records', async () => {
    const { scheduler, focusSessionRecordStorageService, clientPort } = await startListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 })
      }),
      focusSessionRecordHouseKeepDays: 10
    })

    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 10)
    const oldRecord: FocusSessionRecord = { completedAt: oldDate }
    await focusSessionRecordStorageService.saveAll([oldRecord])

    // Focus
    clientPort.send({ name: WorkRequestName.START_TIMER })
    scheduler.advanceTime(3000)
    await flushPromises()

    const newRecords = await focusSessionRecordStorageService.getAll()
    expect(newRecords.length).toBe(1)
    expect(newRecords[0].completedAt > oldDate).toBe(true)
  })

  it('should remove pomodoro record update subscription when disconnect fired', async () => {
    const { listener, clientPort } = await startListener()

    const initialSubscriptionCount = listener.getFocusSessionRecordsUpdateSubscriptionCount()

    clientPort.send({ name: WorkRequestName.LISTEN_TO_POMODORO_RECORDS_UPDATE })

    expect(listener.getFocusSessionRecordsUpdateSubscriptionCount()).toBe(
      initialSubscriptionCount + 1
    )

    clientPort.disconnect()

    expect(listener.getFocusSessionRecordsUpdateSubscriptionCount()).toBe(initialSubscriptionCount)
  })

  it('should display badge when the timer is started', async () => {
    const { badgeDisplayService, scheduler, clientPort } = await startListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ minutes: 25 })
      })
    })

    expect(badgeDisplayService.getDisplayedBadge()).toBe(null)

    clientPort.send({ name: WorkRequestName.START_TIMER })

    const focusBadgeColor: BadgeColor = config.getBadgeColorConfig().focusBadgeColor

    let expected: Badge = {
      text: '25',
      color: focusBadgeColor
    }
    expect(badgeDisplayService.getDisplayedBadge()).toEqual(expected)

    scheduler.advanceTime(1000)

    // remaining 24:59 still display 25
    expect(badgeDisplayService.getDisplayedBadge()).toEqual(expected)

    scheduler.advanceTime(59000)

    // change to 24 only when remaining 24:00
    expected = {
      text: '24',
      color: focusBadgeColor
    }
    expect(badgeDisplayService.getDisplayedBadge()).toEqual(expected)
  })

  it('should trigger closeTabsService whenever the timer is started', async () => {
    const { closeTabsService, clientPort } = await startListener()

    expect(closeTabsService.getTriggerCount()).toBe(0)

    clientPort.send({ name: WorkRequestName.START_TIMER })

    expect(closeTabsService.getTriggerCount()).toBe(1)
  })

  it('should remove badge when the timer is paused', async () => {
    const { badgeDisplayService, clientPort } = await startListener()

    clientPort.send({ name: WorkRequestName.START_TIMER })

    expect(badgeDisplayService.getDisplayedBadge()).not.toBeNull()

    clientPort.send({ name: WorkRequestName.PAUSE_TIMER })

    expect(badgeDisplayService.getDisplayedBadge()).toBeNull()
  })

  it('should remove badge when the timer is finished', async () => {
    const { badgeDisplayService, scheduler, clientPort } = await startListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 1 })
      })
    })

    clientPort.send({ name: WorkRequestName.START_TIMER })
    scheduler.advanceTime(1000)

    expect(badgeDisplayService.getDisplayedBadge()).toBeNull()
  })

  it('should display short break badge properly', async () => {
    const { badgeDisplayService, scheduler, clientPort } = await startListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ minutes: 2 }),
        longBreakDuration: new Duration({ minutes: 4 }),
        focusSessionsPerCycle: 2
      })
    })

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
    const { badgeDisplayService, scheduler, clientPort } = await startListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ minutes: 2 }),
        longBreakDuration: new Duration({ minutes: 4 }),
        focusSessionsPerCycle: 1
      })
    })

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

  it('should trigger notification when time is up', async () => {
    const { newTabService, soundService, notificationService, scheduler, clientPort } =
      await startListener({
        timerConfig: TimerConfig.newTestInstance({
          focusDuration: new Duration({ seconds: 3 })
        }),
        notificationSetting: newTestNotificationSetting({
          reminderTab: true,
          desktopNotification: true,
          sound: true
        })
      })

    expect(newTabService.getTriggerCount()).toBe(0)
    expect(soundService.getTriggerCount()).toBe(0)
    expect(notificationService.getTriggerCount()).toBe(0)

    clientPort.send({ name: WorkRequestName.START_TIMER })
    scheduler.advanceTime(3000)

    expect(newTabService.getTriggerCount()).toBe(1)
    expect(soundService.getTriggerCount()).toBe(1)
    expect(notificationService.getTriggerCount()).toBe(1)
  })

  it('should back up update to storage', async () => {
    const { timerStateStorageService, scheduler, clientPort, timer } = await startListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 })
      })
    })

    clientPort.send({ name: WorkRequestName.START_TIMER })
    scheduler.advanceTime(1000)

    expect(await timerStateStorageService.get()).toEqual(timer.getState())

    clientPort.send({ name: WorkRequestName.PAUSE_TIMER })

    expect(await timerStateStorageService.get()).toEqual(timer.getState())
  })

  it('should restore timer state from storage', async () => {
    const timerStateStorageService = TimerStateStorageService.createFake()
    const targetUpdate: TimerState = {
      remainingSeconds: 1000,
      isRunning: true,
      stage: PomodoroStage.FOCUS,
      numOfPomodoriCompleted: 1
    }
    await timerStateStorageService.save(targetUpdate)

    const { timer } = await startListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 }),
        focusSessionsPerCycle: 2
      }),
      timerStateStorageService
    })

    expect(timer.getState()).toEqual(targetUpdate)
  })

  it('should reset timer config also clear the badge', async () => {
    const { badgeDisplayService, clientPort } = await startListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 })
      })
    })

    clientPort.send({ name: WorkRequestName.START_TIMER })

    expect(badgeDisplayService.getDisplayedBadge()).not.toBeNull()

    clientPort.send({ name: WorkRequestName.RESET_TIMER_CONFIG })
    await flushPromises()

    expect(badgeDisplayService.getDisplayedBadge()).toBeNull()
  })
})

async function startListener({
  timerConfig = TimerConfig.newTestInstance(),
  notificationSetting = newTestNotificationSetting(),
  timerStateStorageService = TimerStateStorageService.createFake(),
  focusSessionRecordHouseKeepDays = 30
} = {}) {
  const props = await startBackgroundListener({
    timerConfig,
    notificationSetting,
    timerStateStorageService,
    focusSessionRecordHouseKeepDays
  })

  return {
    ...props,
    clientPort: props.communicationManager.clientConnect()
  }
}
