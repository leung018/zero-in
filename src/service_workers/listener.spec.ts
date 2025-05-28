import { flushPromises } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import config from '../config'
import { newTestBlockingTimerIntegration } from '../domain/blocking_timer_integration'
import { BrowsingRules } from '../domain/browsing_rules'
import {
  newTestNotificationSetting,
  type NotificationSetting
} from '../domain/notification_setting'
import { TimerConfig } from '../domain/timer/config'
import { Duration } from '../domain/timer/duration'
import type { FocusSessionRecord } from '../domain/timer/record'
import { TimerStage } from '../domain/timer/stage'
import type { TimerState } from '../domain/timer/state'
import { type Badge, type BadgeColor } from '../infra/badge'
import { setUpListener } from '../test_utils/listener'
import type { ClientPort } from './listener'
import { WorkRequestName } from './request'

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

  it('should save the focus session records after focus is completed', async () => {
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

  it('should house keep the focus session records', async () => {
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

    clientPort.send({ name: WorkRequestName.LISTEN_TO_FOCUS_SESSION_RECORDS_UPDATE })

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

  it('should trigger closeTabsService when the timer is started', async () => {
    const { closeTabsService, clientPort } = await startListener()

    expect(closeTabsService.hasTriggered()).toBe(false)

    clientPort.send({ name: WorkRequestName.START_TIMER })

    expect(closeTabsService.hasTriggered()).toBe(true)
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
        hasReminderTabTriggered: true,
        isDesktopNotificationActive: true,
        hasSoundTriggered: true
      }
    },
    {
      input: {
        reminderTab: false,
        desktopNotification: false,
        sound: false
      },
      expected: {
        hasReminderTabTriggered: false,
        isDesktopNotificationActive: false,
        hasSoundTriggered: false
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
        hasReminderTabTriggered: boolean
        isDesktopNotificationActive: boolean
        hasSoundTriggered: boolean
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

      expect(reminderTabService.hasTriggered()).toBe(false)
      expect(soundService.hasTriggered()).toBe(false)
      expect(desktopNotificationService.isNotificationActive()).toBe(false)

      clientPort.send({ name: WorkRequestName.START_TIMER })
      scheduler.advanceTime(3000)

      expect(reminderTabService.hasTriggered()).toBe(expected.hasReminderTabTriggered)
      expect(soundService.hasTriggered()).toBe(expected.hasSoundTriggered)
      expect(desktopNotificationService.isNotificationActive()).toBe(
        expected.isDesktopNotificationActive
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

    expect(listener.getTimerState().remaining).toEqual(new Duration({ seconds: 2 }))
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
    const { listener, timerStateStorageService } = await setUpListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 }),
        focusSessionsPerCycle: 2
      })
    })

    const targetState: TimerState = {
      remaining: new Duration({ seconds: 1000 }),
      isRunning: true,
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 1
    }
    await timerStateStorageService.save(targetState)

    await listener.start()

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

  it('should toggle browsing control when start timer or complete stage', async () => {
    const browsingRules = new BrowsingRules({ blockedDomains: ['example.com'] })

    const { browsingControlService, clientPort, scheduler, listener } = await startListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 1 })
      }),
      blockingTimerIntegration: newTestBlockingTimerIntegration({
        shouldPauseBlockingDuringBreaks: true,
        shouldPauseBlockingWhenTimerIsNotRunning: false
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

    expect(browsingControlService.getActivatedBrowsingRules()).toEqual(browsingRules)

    // Start break
    clientPort.send({ name: WorkRequestName.START_TIMER })
    await flushPromises()

    expect(browsingControlService.getActivatedBrowsingRules()).toBeNull()

    // End break
    clientPort.send({ name: WorkRequestName.START_TIMER })
    scheduler.advanceTime(1000)
    await flushPromises()

    expect(browsingControlService.getActivatedBrowsingRules()).toEqual(browsingRules)
  })

  it('should trigger timer start when click startNext on desktop notification', async () => {
    const { scheduler, clientPort, desktopNotificationService, listener } = await startListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 }),
        focusSessionsPerCycle: 3
      }),
      notificationSetting: newTestNotificationSetting({
        desktopNotification: true
      })
    })

    clientPort.send({ name: WorkRequestName.START_TIMER })
    scheduler.advanceTime(3000)
    await flushPromises()

    desktopNotificationService.simulateClickStartNext()
    await flushPromises()

    expect(listener.getTimerState().isRunning).toBe(true)
    expect(listener.getTimerState().stage).toBe(TimerStage.SHORT_BREAK)
  })

  it('should timer start remove desktop notification', async () => {
    const { scheduler, clientPort, desktopNotificationService } = await startListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 1 })
      }),
      notificationSetting: newTestNotificationSetting({
        desktopNotification: true
      })
    })

    clientPort.send({ name: WorkRequestName.START_TIMER })
    scheduler.advanceTime(1000)
    await flushPromises()

    expect(desktopNotificationService.isNotificationActive()).toBe(true)

    clientPort.send({ name: WorkRequestName.START_TIMER })
    await flushPromises()

    expect(desktopNotificationService.isNotificationActive()).toBe(false)
  })

  it('should addBlockedDomain update the browsing rules', async () => {
    const { listener, browsingControlService } = await startListener({
      browsingRules: new BrowsingRules()
    })
    const newDomain = 'example.com'

    listener.addBlockedDomain(newDomain)
    await flushPromises()

    const browsingRules = browsingControlService.getActivatedBrowsingRules()
    expect(browsingRules).toEqual(new BrowsingRules({ blockedDomains: [newDomain] }))
  })
})

async function startListener({
  timerConfig = TimerConfig.newTestInstance(),
  notificationSetting = newTestNotificationSetting(),
  focusSessionRecordHouseKeepDays = 30,
  blockingTimerIntegration = newTestBlockingTimerIntegration(),
  browsingRules = new BrowsingRules(),
  weeklySchedules = []
} = {}) {
  const context = await setUpListener({
    timerConfig,
    focusSessionRecordHouseKeepDays
  })

  await context.blockingTimerIntegrationStorageService.save(blockingTimerIntegration)
  await context.weeklyScheduleStorageService.saveAll(weeklySchedules)
  await context.browsingRulesStorageService.save(browsingRules)
  await context.notificationSettingStorageService.save(notificationSetting)

  await context.listener.start()

  const clientPort: ClientPort = context.communicationManager.clientConnect()

  return {
    ...context,
    clientPort
  }
}
