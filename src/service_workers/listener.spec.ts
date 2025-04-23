import { describe, expect, it } from 'vitest'
import { WorkRequestName, type WorkRequest } from './request'
import { type Badge, type BadgeColor } from '../infra/badge'
import { Duration } from '../domain/pomodoro/duration'
import config from '../config'
import { startBackgroundListener } from '../test_utils/listener'
import { TimerConfig } from '../domain/pomodoro/config'
import { TimerStateStorageService } from '../domain/pomodoro/state/storage'
import type { TimerState } from '../domain/pomodoro/state'
import { PomodoroStage } from '../domain/pomodoro/stage'
import { flushPromises } from '@vue/test-utils'
import type { FocusSessionRecord } from '../domain/pomodoro/record'
import {
  newTestNotificationSetting,
  type NotificationSetting
} from '../domain/notification_setting'
import type { Port } from '../infra/communication'
import type { WorkResponse } from './response'
import { BlockingTimerIntegrationStorageService } from '../domain/blocking_timer_integration/storage'
import { BrowsingRules } from '../domain/browsing_rules'
import { WeeklyScheduleStorageService } from '../domain/schedules/storage'
import { BrowsingRulesStorageService } from '../domain/browsing_rules/storage'

// Noted that below doesn't cover all the behaviors of BackgroundListener. Some of that is covered in other vue component tests.
describe('BackgroundListener', () => {
  it('should able to subscribe or unsubscribe to timer state', async () => {
    const { listener, clientPort } = await startListener()

    const initialSubscriptionCount = listener.getTimerStateSubscriptionCount()

    clientPort.send({ name: WorkRequestName.LISTEN_TO_TIMER })

    expect(listener.getTimerStateSubscriptionCount()).toBe(initialSubscriptionCount + 1)

    clientPort.disconnect()

    expect(listener.getTimerStateSubscriptionCount()).toBe(initialSubscriptionCount)
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

  it('should able to subscribe or unsubscribe to focus session records update', async () => {
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

    clientPort.send({
      name: WorkRequestName.RESTART_FOCUS,
      payload: {
        nth: 1
      }
    })

    expect(closeTabsService.getTriggerCount()).toBe(2)

    clientPort.send({
      name: WorkRequestName.RESTART_SHORT_BREAK,
      payload: {
        nth: 1
      }
    })

    expect(closeTabsService.getTriggerCount()).toBe(3)

    clientPort.send({
      name: WorkRequestName.RESTART_LONG_BREAK
    })

    expect(closeTabsService.getTriggerCount()).toBe(4)
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

  it.each([
    {
      input: {
        reminderTab: true,
        desktopNotification: true,
        sound: true
      },
      expected: {
        reminderTabNotificationTriggerCount: 1,
        desktopNotificationTriggerCount: 1,
        soundNotificationTriggerCount: 1
      }
    },
    {
      input: {
        reminderTab: false,
        desktopNotification: false,
        sound: false
      },
      expected: {
        reminderTabNotificationTriggerCount: 0,
        desktopNotificationTriggerCount: 0,
        soundNotificationTriggerCount: 0
      }
    }
  ])(
    'should trigger notification when time is up',
    async ({
      input,
      expected
    }: {
      input: NotificationSetting
      expected: {
        reminderTabNotificationTriggerCount: number
        desktopNotificationTriggerCount: number
        soundNotificationTriggerCount: number
      }
    }) => {
      const {
        reminderTabService,
        soundService,
        desktopNotificationService,
        scheduler,
        clientPort
      } = await startListener({
        timerConfig: TimerConfig.newTestInstance({
          focusDuration: new Duration({ seconds: 3 })
        }),
        notificationSetting: input
      })

      expect(reminderTabService.getTriggerCount()).toBe(0)
      expect(soundService.getTriggerCount()).toBe(0)
      expect(desktopNotificationService.getTriggerCount()).toBe(0)

      clientPort.send({ name: WorkRequestName.START_TIMER })
      scheduler.advanceTime(3000)

      expect(reminderTabService.getTriggerCount()).toBe(
        expected.reminderTabNotificationTriggerCount
      )
      expect(soundService.getTriggerCount()).toBe(expected.soundNotificationTriggerCount)
      expect(desktopNotificationService.getTriggerCount()).toBe(
        expected.desktopNotificationTriggerCount
      )
    }
  )

  it('should getTimerState sync with timer', async () => {
    const { listener, clientPort, scheduler } = await startListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 })
      })
    })

    clientPort.send({ name: WorkRequestName.START_TIMER })
    scheduler.advanceTime(1000)

    expect(listener.getTimerState().remainingSeconds).toBe(2)
  })

  it('should back up update of timer to storage', async () => {
    const { timerStateStorageService, scheduler, clientPort, listener } = await startListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 })
      })
    })

    clientPort.send({ name: WorkRequestName.START_TIMER })
    scheduler.advanceTime(1000)

    expect(await timerStateStorageService.get()).toEqual(listener.getTimerState())

    clientPort.send({ name: WorkRequestName.PAUSE_TIMER })

    expect(await timerStateStorageService.get()).toEqual(listener.getTimerState())
  })

  it('should restore timer state from storage', async () => {
    const timerStateStorageService = TimerStateStorageService.createFake()
    const targetState: TimerState = {
      remainingSeconds: 1000,
      isRunning: true,
      stage: PomodoroStage.FOCUS,
      numOfPomodoriCompleted: 1
    }
    await timerStateStorageService.save(targetState)

    const { listener } = await startListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 }),
        focusSessionsPerCycle: 2
      }),
      timerStateStorageService
    })

    expect(listener.getTimerState()).toEqual(targetState)
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

  it('should toggle browsing control when timer ever timer duration is finished', async () => {
    const browsingRules = new BrowsingRules({ blockedDomains: ['example.com'] })

    const { browsingControlService, clientPort, scheduler, listener } = await startListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 1 })
      }),
      browsingRules,
      weeklySchedules: []
    })

    listener.toggleBrowsingRules()
    await flushPromises()

    expect(browsingControlService.getActivatedBrowsingRules()).toEqual(browsingRules)

    clientPort.send({ name: WorkRequestName.START_TIMER })
    scheduler.advanceTime(3000)
    await flushPromises()

    expect(browsingControlService.getActivatedBrowsingRules()).toBeNull()

    clientPort.send({ name: WorkRequestName.START_TIMER })
    scheduler.advanceTime(1000)
    await flushPromises()
    expect(browsingControlService.getActivatedBrowsingRules()).toEqual(browsingRules)
  })
})

async function startListener({
  timerConfig = TimerConfig.newTestInstance(),
  notificationSetting = newTestNotificationSetting(),
  timerStateStorageService = TimerStateStorageService.createFake(),
  focusSessionRecordHouseKeepDays = 30,
  shouldPauseBlockingDuringBreaks = true,
  browsingRules = new BrowsingRules(),
  weeklySchedules = []
} = {}) {
  const blockingTimerIntegrationStorageService = BlockingTimerIntegrationStorageService.createFake()
  await blockingTimerIntegrationStorageService.save({
    shouldPauseBlockingDuringBreaks
  })

  const weeklyScheduleStorageService = WeeklyScheduleStorageService.createFake()
  await weeklyScheduleStorageService.saveAll(weeklySchedules)

  const browsingRulesStorageService = BrowsingRulesStorageService.createFake()
  await browsingRulesStorageService.save(browsingRules)

  const props = await startBackgroundListener({
    timerConfig,
    notificationSetting,
    timerStateStorageService,
    focusSessionRecordHouseKeepDays,
    blockingTimerIntegrationStorageService,
    browsingRulesStorageService,
    weeklyScheduleStorageService
  })

  const clientPort: Port<WorkRequest, WorkResponse> = props.communicationManager.clientConnect()

  return {
    ...props,
    clientPort
  }
}
