import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import config from '../config'
import { BrowsingRules } from '../domain/browsing_rules'
import {
  newTestNotificationSetting,
  type NotificationSetting
} from '../domain/notification_setting'
import { TimerConfig } from '../domain/timer/config'
import { TimerConfigStorageService } from '../domain/timer/config/storage'
import { Duration } from '../domain/timer/duration'
import type { FocusSessionRecord } from '../domain/timer/record'
import { TimerStage } from '../domain/timer/stage'
import { TimerInternalState } from '../domain/timer/state/internal'
import { TimerStateStorageService } from '../domain/timer/state/storage'
import { newTestTimerBasedBlockingRules } from '../domain/timer_based_blocking'
import { type Badge, type BadgeColor } from '../infra/badge'
import { setUpListener } from '../test_utils/listener'
import { getDateAfter } from '../utils/date'
import type { ClientPort } from './listener'
import { newResetTimerConfigRequest, WorkRequestName } from './request'

// Noted that below doesn't cover all the behaviors of BackgroundListener. Some of that is covered in other vue component tests.
describe('BackgroundListener', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should able to unsubscribe to timer state', async () => {
    const { listener, clientPort } = await startListener()

    const initialSubscriptionCount = listener.getTimerStateSubscriptionCount()

    clientPort.disconnect()

    expect(listener.getTimerStateSubscriptionCount()).toBe(initialSubscriptionCount - 1)
  })

  it('should save the focus session records after focus is completed', async () => {
    const { clientPort, focusSessionRecordsStorageService } = await startListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 1 })
      })
    })

    const startTime = new Date()
    vi.setSystemTime(startTime)

    // Focus
    await clientPort.send({ name: WorkRequestName.START_TIMER })
    vi.advanceTimersByTime(3000)
    await flushPromises()

    const focusSessionRecords = await focusSessionRecordsStorageService.get()
    expect(focusSessionRecords.length).toBe(1)
    expect(focusSessionRecords[0].completedAt).toEqual(
      getDateAfter({ from: startTime, duration: new Duration({ seconds: 3 }) })
    )
    expect(focusSessionRecords[0].startedAt).toEqual(startTime)

    // Break
    await clientPort.send({ name: WorkRequestName.START_TIMER })
    vi.advanceTimersByTime(1000)
    await flushPromises()

    expect((await focusSessionRecordsStorageService.get()).length).toBe(1)
  })

  it('should house keep the focus session records', async () => {
    const { focusSessionRecordsStorageService, clientPort } = await startListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 })
      }),
      focusSessionRecordHouseKeepDays: 10
    })

    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 10)
    const oldRecord: FocusSessionRecord = { completedAt: oldDate }
    await focusSessionRecordsStorageService.save([oldRecord])

    // Focus
    await clientPort.send({ name: WorkRequestName.START_TIMER })
    vi.advanceTimersByTime(3000)
    await flushPromises()

    const newRecords = await focusSessionRecordsStorageService.get()
    expect(newRecords.length).toBe(1)
    expect(newRecords[0].completedAt > oldDate).toBe(true)
  })

  it('should display badge when the timer is started', async () => {
    const { badgeDisplayService, clientPort } = await startListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ minutes: 25 })
      })
    })

    expect(badgeDisplayService.getDisplayedBadge()).toBe(null)

    await clientPort.send({ name: WorkRequestName.START_TIMER })

    const focusBadgeColor: BadgeColor = config.getBadgeColorConfig().focusBadgeColor

    let expected: Badge = {
      text: '25',
      color: focusBadgeColor
    }
    expect(badgeDisplayService.getDisplayedBadge()).toEqual(expected)

    vi.advanceTimersByTime(1000)

    // remaining 24:59 still display 25
    expect(badgeDisplayService.getDisplayedBadge()).toEqual(expected)

    vi.advanceTimersByTime(59000)

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

    await clientPort.send({ name: WorkRequestName.START_TIMER })

    expect(closeTabsService.hasTriggered()).toBe(true)
  })

  it('should remove badge when the timer is paused', async () => {
    const { badgeDisplayService, clientPort } = await startListener()

    await clientPort.send({ name: WorkRequestName.START_TIMER })

    expect(badgeDisplayService.getDisplayedBadge()).not.toBeNull()

    await clientPort.send({ name: WorkRequestName.PAUSE_TIMER })

    expect(badgeDisplayService.getDisplayedBadge()).toBeNull()
  })

  it('should remove badge when the timer is finished', async () => {
    const { badgeDisplayService, clientPort } = await startListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 1 })
      })
    })

    await clientPort.send({ name: WorkRequestName.START_TIMER })
    vi.advanceTimersByTime(1000)

    expect(badgeDisplayService.getDisplayedBadge()).toBeNull()
  })

  it('should display short break badge properly', async () => {
    const { badgeDisplayService, clientPort } = await startListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ minutes: 2 }),
        longBreakDuration: new Duration({ minutes: 4 }),
        focusSessionsPerCycle: 2
      })
    })

    await clientPort.send({ name: WorkRequestName.START_TIMER })
    vi.advanceTimersByTime(3000)

    // start short break
    await clientPort.send({ name: WorkRequestName.START_TIMER })

    const expected: Badge = {
      text: '2',
      color: config.getBadgeColorConfig().breakBadgeColor
    }
    expect(badgeDisplayService.getDisplayedBadge()).toEqual(expected)
  })

  it('should display long break badge properly', async () => {
    const { badgeDisplayService, clientPort } = await startListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ minutes: 2 }),
        longBreakDuration: new Duration({ minutes: 4 }),
        focusSessionsPerCycle: 1
      })
    })

    await clientPort.send({ name: WorkRequestName.START_TIMER })
    vi.advanceTimersByTime(3000)

    // start long break
    await clientPort.send({ name: WorkRequestName.START_TIMER })

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
      const { reminderTabService, soundService, desktopNotificationService, clientPort } =
        await startListener({
          timerConfig: TimerConfig.newTestInstance({
            focusDuration: new Duration({ seconds: 3 })
          }),
          notificationSetting: input
        })

      expect(reminderTabService.hasTriggered()).toBe(false)
      expect(soundService.hasTriggered()).toBe(false)
      expect(desktopNotificationService.isNotificationActive()).toBe(false)

      await clientPort.send({ name: WorkRequestName.START_TIMER })
      vi.advanceTimersByTime(3000)
      await flushPromises()

      expect(reminderTabService.hasTriggered()).toBe(expected.hasReminderTabTriggered)
      expect(soundService.hasTriggered()).toBe(expected.hasSoundTriggered)
      expect(desktopNotificationService.isNotificationActive()).toBe(
        expected.isDesktopNotificationActive
      )
    }
  )

  it('should getTimerExternalState sync with timer', async () => {
    const { listener, clientPort } = await startListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 })
      })
    })

    await clientPort.send({ name: WorkRequestName.START_TIMER })
    vi.advanceTimersByTime(1000)

    expect(listener.getTimerExternalState().remaining).toEqual(new Duration({ seconds: 2 }))
  })

  it('should back up update of timer to storage', async () => {
    const { timerStateStorageService, clientPort, listener } = await startListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 }),
        focusSessionsPerCycle: 3
      })
    })

    const assertTimerStatesMatch = async () => {
      expect((await timerStateStorageService.get())?.toExternalState()).toEqual(
        listener.getTimerExternalState()
      )
    }

    // Start Timer
    await clientPort.send({ name: WorkRequestName.START_TIMER })
    vi.advanceTimersByTime(1000)
    await assertTimerStatesMatch()

    // Pause Timer
    await clientPort.send({ name: WorkRequestName.PAUSE_TIMER })
    await assertTimerStatesMatch()

    // Resume Timer
    await clientPort.send({ name: WorkRequestName.START_TIMER })
    await assertTimerStatesMatch()

    // Complete Focus Session
    vi.advanceTimersByTime(2000)
    await assertTimerStatesMatch()

    // Restart Focus
    await clientPort.send({ name: WorkRequestName.RESTART_FOCUS, payload: { nth: 1 } })
    await assertTimerStatesMatch()

    // Restart Short Break
    await clientPort.send({ name: WorkRequestName.RESTART_SHORT_BREAK, payload: { nth: 1 } })
    await assertTimerStatesMatch()

    // Restart Long Break
    await clientPort.send({ name: WorkRequestName.RESTART_LONG_BREAK })
    await assertTimerStatesMatch()

    // Reset Config
    await clientPort.send(newResetTimerConfigRequest(TimerConfig.newTestInstance()))
    await flushPromises()
    await assertTimerStatesMatch()
  })

  it('should restore timer state from storage', async () => {
    const { listener, timerStateStorageService } = await setUpListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 }),
        focusSessionsPerCycle: 2
      })
    })

    const targetState = TimerInternalState.newRunningState({
      timerId: 'not matter',
      remaining: new Duration({ seconds: 1 }),
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 1
    })
    await timerStateStorageService.save(targetState)

    await listener.start()

    expect(listener.getTimerExternalState()).toEqual(targetState.toExternalState())
  })

  it('should reset timer config also clear the badge', async () => {
    const { badgeDisplayService, clientPort } = await startListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 })
      })
    })

    await clientPort.send({ name: WorkRequestName.START_TIMER })

    expect(badgeDisplayService.getDisplayedBadge()).not.toBeNull()

    await clientPort.send(newResetTimerConfigRequest(TimerConfig.newTestInstance()))
    await flushPromises()

    expect(badgeDisplayService.getDisplayedBadge()).toBeNull()
  })

  it('should toggle browsing rules when start timer or complete stage', async () => {
    const browsingRules = new BrowsingRules({ blockedDomains: ['example.com'] })

    const { browsingControlService, clientPort } = await startListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 1 })
      }),
      timerBasedBlockingRules: newTestTimerBasedBlockingRules({
        pauseBlockingDuringBreaks: true,
        pauseBlockingWhenTimerNotRunning: false
      }),
      browsingRules,
      weeklySchedules: []
    })

    await clientPort.send({ name: WorkRequestName.START_TIMER })
    await flushPromises()
    expect(browsingControlService.getActivatedBrowsingRules()).toEqual(browsingRules)

    vi.advanceTimersByTime(3000)
    await flushPromises()

    expect(browsingControlService.getActivatedBrowsingRules()).toEqual(browsingRules)

    // Start break
    await clientPort.send({ name: WorkRequestName.START_TIMER })
    await flushPromises()

    expect(browsingControlService.getActivatedBrowsingRules()).toBeNull()

    // End break
    await clientPort.send({ name: WorkRequestName.START_TIMER })
    vi.advanceTimersByTime(1000)
    await flushPromises()

    expect(browsingControlService.getActivatedBrowsingRules()).toEqual(browsingRules)
  })

  it('should toggle browsing rules when timer is paused in focus session', async () => {
    const browsingRules = new BrowsingRules({ blockedDomains: ['example.com'] })

    const { browsingControlService, clientPort, listener } = await startListener({
      timerBasedBlockingRules: newTestTimerBasedBlockingRules({
        pauseBlockingWhenTimerNotRunning: true
      }),
      browsingRules,
      weeklySchedules: []
    })

    listener.toggleBrowsingRules()
    await flushPromises()

    expect(browsingControlService.getActivatedBrowsingRules()).toBeNull()

    await clientPort.send({ name: WorkRequestName.START_TIMER })
    await flushPromises()

    expect(browsingControlService.getActivatedBrowsingRules()).toEqual(browsingRules)

    await clientPort.send({ name: WorkRequestName.PAUSE_TIMER })
    await flushPromises()

    expect(browsingControlService.getActivatedBrowsingRules()).toBeNull()
  })

  it('should desktop notification button title being shown properly', async () => {
    const { desktopNotificationService, clientPort } = await startListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 }),
        focusSessionsPerCycle: 3
      }),
      notificationSetting: newTestNotificationSetting({
        desktopNotification: true
      })
    })

    await clientPort.send({ name: WorkRequestName.START_TIMER })
    vi.advanceTimersByTime(3000)
    await flushPromises()

    expect(desktopNotificationService.getLastShownButtonTitle()).toBe('Start 1st Break')
  })

  it('should trigger timer start when click start on desktop notification', async () => {
    const { clientPort, desktopNotificationService, listener } = await startListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 }),
        focusSessionsPerCycle: 3
      }),
      notificationSetting: newTestNotificationSetting({
        desktopNotification: true
      })
    })

    await clientPort.send({ name: WorkRequestName.START_TIMER })
    vi.advanceTimersByTime(3000)
    await flushPromises()

    desktopNotificationService.simulateClickStart()
    await flushPromises()

    expect(listener.getTimerExternalState().isRunning).toBe(true)
    expect(listener.getTimerExternalState().stage).toBe(TimerStage.SHORT_BREAK)
  })

  it('should timer start remove desktop notification', async () => {
    const { clientPort, desktopNotificationService } = await startListener({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 1 })
      }),
      notificationSetting: newTestNotificationSetting({
        desktopNotification: true
      })
    })

    await clientPort.send({ name: WorkRequestName.START_TIMER })
    vi.advanceTimersByTime(1000)
    await flushPromises()

    expect(desktopNotificationService.isNotificationActive()).toBe(true)

    await clientPort.send({ name: WorkRequestName.START_TIMER })
    await flushPromises()

    expect(desktopNotificationService.isNotificationActive()).toBe(false)
  })

  it('should addBlockedDomain update the browsing rules', async () => {
    const { listener, browsingControlService } = await startListener({
      browsingRules: new BrowsingRules()
    })
    const newDomain = 'example.com'

    await listener.addBlockedDomain(newDomain)

    const browsingRules = browsingControlService.getActivatedBrowsingRules()
    expect(browsingRules).toEqual(new BrowsingRules({ blockedDomains: [newDomain] }))
  })

  it('should sync timer states between listeners', async () => {
    const {
      clientPort: clientPort1,
      listener: listener1,
      timerStateStorageService
    } = await startListenerWithTimerSync()
    const { listener: listener2 } = await startListenerWithTimerSync({
      timerStateStorageService
    })

    await clientPort1.send({ name: WorkRequestName.START_TIMER })
    await flushPromises()

    expect(listener1.getTimerExternalState().isRunning).toBe(true)
    expect(listener2.getTimerExternalState()).toEqual(listener1.getTimerExternalState())
  })

  it('should sync timer config to listener from timerConfigStorageService', async () => {
    const { listener, timerConfigStorageService, clientPort } = await startListenerWithTimerSync({
      timerConfig: TimerConfig.newTestInstance({
        focusSessionsPerCycle: 1
      })
    })

    await clientPort.send({ name: WorkRequestName.START_TIMER })

    const newConfig = TimerConfig.newTestInstance({
      focusSessionsPerCycle: 4
    })
    await timerConfigStorageService.save(newConfig)

    expect(listener.getTimerConfig()).toEqual(newConfig)
    expect(listener.getTimerExternalState().isRunning).toBe(true) // Not to reset timer when sync timer config
  })

  it('should reload can get the new timer state and timer config', async () => {
    const { listener, clientPort, timerStateStorageService, timerConfigStorageService } =
      await startListenerWithTimerSync({
        timerConfig: TimerConfig.newTestInstance({
          focusDuration: new Duration({ seconds: 1 })
        })
      })

    await clientPort.send({ name: WorkRequestName.START_TIMER })
    await flushPromises()

    timerConfigStorageService.unsubscribeAll()
    const newConfig = TimerConfig.newTestInstance({
      focusDuration: new Duration({ seconds: 3 })
    })
    await timerConfigStorageService.save(newConfig)

    timerStateStorageService.unsubscribeAll()
    const newState = TimerInternalState.newTestInstance({
      pausedAt: new Date(),
      endAt: getDateAfter({
        duration: new Duration({ seconds: 2 })
      })
    })
    await timerStateStorageService.save(newState)

    await listener.reload()

    expect(listener.getTimerExternalState().remaining).toEqual(new Duration({ seconds: 2 }))
    expect(listener.getTimerExternalState().isRunning).toBe(false)

    expect(listener.getTimerConfig()).toEqual(newConfig)
  })

  it('should reload can set the new notification setting from storage service', async () => {
    const { clientPort, listener, desktopNotificationService, notificationSettingStorageService } =
      await startListener({
        timerConfig: TimerConfig.newTestInstance({
          focusDuration: new Duration({ seconds: 1 })
        }),
        notificationSetting: newTestNotificationSetting({
          desktopNotification: true
        })
      })

    await notificationSettingStorageService.save(
      newTestNotificationSetting({
        desktopNotification: false
      })
    )
    await listener.reload()

    clientPort.send({ name: WorkRequestName.START_TIMER })
    vi.advanceTimersByTime(1000)

    expect(desktopNotificationService.isNotificationActive()).toBe(false)
  })

  it('should reload reset subscription in timerStateStorageService', async () => {
    const { listener, timerStateStorageService } = await startListenerWithTimerSync({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 })
      })
    })

    let changeCounter = 0
    await timerStateStorageService.onChange(() => {
      changeCounter++
    })

    await listener.reload()

    // Unsubscribed previous subscription in timerStateStorageService
    await timerStateStorageService.save(
      TimerInternalState.newTestInstance({
        pausedAt: new Date(),
        endAt: getDateAfter({
          duration: new Duration({ seconds: 2 })
        })
      })
    )
    expect(changeCounter).toBe(0)

    // Reload can reset subscription inside listener
    expect(listener.getTimerExternalState().remaining).toEqual(new Duration({ seconds: 2 }))
  })

  it('should reload reset subscription in timerConfigStorageService', async () => {
    const { listener, timerConfigStorageService } = await startListenerWithTimerSync({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 })
      })
    })

    let changeCounter = 0
    await timerConfigStorageService.onChange(() => {
      changeCounter++
    })

    await listener.reload()

    // Unsubscribed previous subscription in timerConfigStorageService
    await timerConfigStorageService.save(
      TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 2 })
      })
    )
    expect(changeCounter).toBe(0)

    // Reload can reset subscription inside listener
    expect(listener.getTimerConfig().focusDuration).toEqual(new Duration({ seconds: 2 }))
  })

  it('should reload toggle browsing rules', async () => {
    const browsingRules = new BrowsingRules({ blockedDomains: ['example.com'] })

    const { listener, clientPort, timerStateStorageService, browsingControlService } =
      await startListenerWithTimerSync({
        browsingRules,
        timerBasedBlockingRules: newTestTimerBasedBlockingRules({
          pauseBlockingWhenTimerNotRunning: true
        }),
        weeklySchedules: []
      })

    await clientPort.send({ name: WorkRequestName.START_TIMER })
    await flushPromises()

    expect(browsingControlService.getActivatedBrowsingRules()).toEqual(browsingRules)

    timerStateStorageService.unsubscribeAll()
    await timerStateStorageService.save(
      TimerInternalState.newTestInstance({
        pausedAt: new Date()
      })
    )

    await listener.reload()

    expect(browsingControlService.getActivatedBrowsingRules()).toBeNull()
  })

  it('should reload can reset display badge', async () => {
    const { badgeDisplayService, clientPort, timerStateStorageService, listener } =
      await startListenerWithTimerSync({
        timerConfig: TimerConfig.newTestInstance({
          focusDuration: new Duration({ seconds: 1 })
        })
      })

    await clientPort.send({ name: WorkRequestName.START_TIMER })
    await flushPromises()

    expect(badgeDisplayService.getDisplayedBadge()).not.toBeNull()

    timerStateStorageService.unsubscribeAll()
    await timerStateStorageService.save(
      TimerInternalState.newTestInstance({
        pausedAt: new Date()
      })
    )

    await listener.reload()
    await flushPromises()

    expect(badgeDisplayService.getDisplayedBadge()).toBeNull()
  })
})

async function startListener({
  timerConfig = TimerConfig.newTestInstance(),
  notificationSetting = newTestNotificationSetting(),
  focusSessionRecordHouseKeepDays = 30,
  timerBasedBlockingRules = newTestTimerBasedBlockingRules(),
  browsingRules = new BrowsingRules(),
  weeklySchedules = [],
  timerStateStorageService = TimerStateStorageService.createFake(),
  timerConfigStorageService = TimerConfigStorageService.createFake()
} = {}) {
  const context = await setUpListener({
    timerConfig,
    focusSessionRecordHouseKeepDays,
    timerStateStorageService,
    timerConfigStorageService
  })

  await context.timerBasedBlockingRulesStorageService.save(timerBasedBlockingRules)
  await context.weeklySchedulesStorageService.save(weeklySchedules)
  await context.browsingRulesStorageService.save(browsingRules)
  await context.notificationSettingStorageService.save(notificationSetting)

  await context.listener.start()

  const clientPort: ClientPort = context.communicationManager.clientConnect()

  return {
    ...context,
    clientPort
  }
}

/**
 * Using timerStateStorageService and timerConfigStorageService with ObservableStorage as default parameters
 */
async function startListenerWithTimerSync({
  timerConfig = TimerConfig.newTestInstance(),
  notificationSetting = newTestNotificationSetting(),
  timerBasedBlockingRules = newTestTimerBasedBlockingRules(),
  browsingRules = new BrowsingRules(),
  weeklySchedules = [],
  timerStateStorageService = TimerStateStorageService.createObservableFake()
} = {}) {
  return startListener({
    timerConfig,
    notificationSetting,
    timerBasedBlockingRules,
    browsingRules,
    weeklySchedules,
    timerStateStorageService,
    timerConfigStorageService: TimerConfigStorageService.createObservableFake()
  })
}
