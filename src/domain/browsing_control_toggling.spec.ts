import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FakeBrowsingControlService } from '../infra/browsing_control'
import type { BlockingTimerIntegration } from './blocking_timer_integration'
import { BlockingTimerIntegrationStorageService } from './blocking_timer_integration/storage'
import { BrowsingControlTogglingService } from './browsing_control_toggling'
import { BrowsingRules } from './browsing_rules'
import { BrowsingRulesStorageService } from './browsing_rules/storage'
import { Weekday, WeeklySchedule } from './schedules'
import { WeeklyScheduleStorageService } from './schedules/storage'
import { Time } from './time'
import { Duration } from './timer/duration'
import { newFocusSessionRecord } from './timer/record'
import { FocusSessionRecordStorageService } from './timer/record/storage'
import { TimerStage } from './timer/stage'

describe('BrowsingControlTogglingService', () => {
  const browsingRules = new BrowsingRules({ blockedDomains: ['example.com', 'facebook.com'] })

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should toggle according to if current time is within schedule', async () => {
    const schedules = [
      new WeeklySchedule({
        weekdaySet: new Set([Weekday.MON, Weekday.TUE]),
        startTime: new Time(9, 0),
        endTime: new Time(17, 0)
      })
    ]

    vi.setSystemTime(new Date('2025-02-03T11:00:00')) // 2025-02-03 is Monday
    expect(
      await getBrowsingRulesAfterToggling({
        browsingRules,
        schedules,
        pauseBlockingDuringBreaks: false,
        pauseBlockingWhenTimerNotRunning: false
      })
    ).toEqual(browsingRules)

    vi.setSystemTime(new Date('2025-02-03T17:01:00'))
    expect(
      await getBrowsingRulesAfterToggling({
        browsingRules,
        schedules,
        pauseBlockingDuringBreaks: false,
        pauseBlockingWhenTimerNotRunning: false
      })
    ).toBeNull()
  })

  it('should toggle according to target focus sessions complete if current time is within schedule and target focus sessions is set', async () => {
    const schedules = [
      new WeeklySchedule({
        weekdaySet: new Set([Weekday.MON, Weekday.TUE]),
        startTime: new Time(9, 0),
        endTime: new Time(17, 0),
        targetFocusSessions: 2
      })
    ]

    vi.setSystemTime(new Date('2025-02-04T16:59:59')) // 2025-02-04 is Tuesday
    expect(
      await getBrowsingRulesAfterToggling({
        browsingRules,
        schedules,
        pauseBlockingDuringBreaks: false,
        pauseBlockingWhenTimerNotRunning: false,
        focusSessionRecords: [
          newFocusSessionRecord(new Date('2025-02-03T11:00:00')),
          newFocusSessionRecord(new Date('2025-02-03T11:26:00')),

          newFocusSessionRecord(new Date('2025-02-04T08:59:59')),
          newFocusSessionRecord(new Date('2025-02-04T09:00:00'))
        ]
      })
    ).toEqual(browsingRules)

    vi.setSystemTime(new Date('2025-02-03T16:59:59'))
    expect(
      await getBrowsingRulesAfterToggling({
        browsingRules,
        schedules,
        pauseBlockingDuringBreaks: false,
        pauseBlockingWhenTimerNotRunning: false,
        focusSessionRecords: [
          newFocusSessionRecord(new Date('2025-02-03T09:00:00')),
          newFocusSessionRecord(new Date('2025-02-03T16:59:59'))
        ]
      })
    ).toBeNull()
  })

  it('should always activate when weekly schedules are empty', async () => {
    expect(
      await getBrowsingRulesAfterToggling({
        browsingRules,
        schedules: [],
        pauseBlockingDuringBreaks: false,
        pauseBlockingWhenTimerNotRunning: false
      })
    ).toEqual(browsingRules)
  })

  it('should overlapped schedules will make the blocking active when one of them is active', async () => {
    const schedules = [
      new WeeklySchedule({
        weekdaySet: new Set([Weekday.MON]),
        startTime: new Time(9, 0),
        endTime: new Time(17, 0),
        targetFocusSessions: 1
      }),
      new WeeklySchedule({
        weekdaySet: new Set([Weekday.MON]),
        startTime: new Time(10, 0),
        endTime: new Time(13, 0)
      })
    ]

    // 2025-02-03 is Monday
    vi.setSystemTime(new Date('2025-02-03T11:00:00'))
    expect(
      await getBrowsingRulesAfterToggling({
        browsingRules,
        schedules,
        focusSessionRecords: [newFocusSessionRecord(new Date('2025-02-03T10:00:00'))],
        pauseBlockingDuringBreaks: false,
        pauseBlockingWhenTimerNotRunning: false
      })
    ).toEqual(browsingRules)
  })

  it.each([
    newTimerInfo({
      timerStage: TimerStage.SHORT_BREAK,
      isRunning: true,
      remainingSeconds: 99,
      shortBreakSeconds: 99
    }),
    newTimerInfo({
      timerStage: TimerStage.LONG_BREAK,
      isRunning: true,
      remainingSeconds: 99,
      longBreakSeconds: 99
    }),
    newTimerInfo({
      timerStage: TimerStage.SHORT_BREAK,
      isRunning: false,
      remainingSeconds: 98,
      shortBreakSeconds: 99
    }),
    newTimerInfo({
      timerStage: TimerStage.LONG_BREAK,
      isRunning: false,
      remainingSeconds: 98,
      longBreakSeconds: 99
    }),
    newTimerInfo({
      timerStage: TimerStage.SHORT_BREAK,
      isRunning: true,
      remainingSeconds: 0,
      shortBreakSeconds: 99
    }),
    newTimerInfo({
      timerStage: TimerStage.LONG_BREAK,
      isRunning: true,
      remainingSeconds: 0,
      longBreakSeconds: 99
    })
  ])(
    'should not activate browsing rules when timer is in break and pauseBlockingDuringBreaks is enabled',
    async (timerInfo) => {
      expect(
        await getBrowsingRulesAfterToggling({
          browsingRules,
          schedules: [],
          pauseBlockingDuringBreaks: true,
          pauseBlockingWhenTimerNotRunning: false,
          timerInfo
        })
      ).toBeNull()
    }
  )

  it.each([
    {
      pauseBlockingDuringBreaks: true,
      timerInfo: newTimerInfo({
        timerStage: TimerStage.FOCUS
      })
    },
    {
      pauseBlockingDuringBreaks: false,
      timerInfo: newTimerInfo({
        timerStage: TimerStage.SHORT_BREAK,
        isRunning: true
      })
    },
    {
      pauseBlockingDuringBreaks: false,
      timerInfo: newTimerInfo({
        timerStage: TimerStage.LONG_BREAK,
        isRunning: true
      })
    },
    {
      pauseBlockingDuringBreaks: true,
      timerInfo: newTimerInfo({
        timerStage: TimerStage.SHORT_BREAK,
        isRunning: false,
        remainingSeconds: 99,
        shortBreakSeconds: 99
      })
    },
    {
      pauseBlockingDuringBreaks: true,
      timerInfo: newTimerInfo({
        timerStage: TimerStage.LONG_BREAK,
        isRunning: false,
        remainingSeconds: 99,
        longBreakSeconds: 99
      })
    }
  ])(
    'should activate browsing rule if timer is not in break or pauseBlockingDuringBreaks is disabled',
    async ({ pauseBlockingDuringBreaks, timerInfo }) => {
      expect(
        await getBrowsingRulesAfterToggling({
          browsingRules,
          schedules: [],
          pauseBlockingDuringBreaks,
          pauseBlockingWhenTimerNotRunning: false,
          timerInfo
        })
      ).toEqual(browsingRules)
    }
  )

  it('should not activate browsing rules when timer is not running and pauseBlockingWhenTimerNotRunning is enabled', async () => {
    expect(
      await getBrowsingRulesAfterToggling({
        browsingRules,
        schedules: [],
        pauseBlockingWhenTimerNotRunning: true,
        timerInfo: newTimerInfo({
          timerStage: TimerStage.FOCUS,
          isRunning: false
        })
      })
    ).toBeNull()
  })

  it('should activate browsing rules when timer is running focus session even pauseBlockingWhenTimerNotRunning is enabled', async () => {
    expect(
      await getBrowsingRulesAfterToggling({
        browsingRules,
        schedules: [],
        pauseBlockingWhenTimerNotRunning: true,
        timerInfo: newTimerInfo({
          timerStage: TimerStage.FOCUS,
          isRunning: true
        })
      })
    ).toEqual(browsingRules)
  })
})

function newTimerInfo({
  timerStage = TimerStage.FOCUS,
  isRunning = false,
  remainingSeconds = 99,
  longBreakSeconds = 999,
  shortBreakSeconds = 499
} = {}) {
  return {
    timerStage,
    isRunning,
    remaining: new Duration({ seconds: remainingSeconds }),
    longBreak: new Duration({ seconds: longBreakSeconds }),
    shortBreak: new Duration({ seconds: shortBreakSeconds })
  }
}

async function getBrowsingRulesAfterToggling({
  browsingRules = new BrowsingRules(),
  schedules = [
    new WeeklySchedule({
      weekdaySet: new Set([Weekday.MON]),
      startTime: new Time(0, 0),
      endTime: new Time(23, 59)
    })
  ],
  pauseBlockingDuringBreaks = false,
  pauseBlockingWhenTimerNotRunning = false,
  timerInfo = newTimerInfo(),
  focusSessionRecords = [newFocusSessionRecord()]
} = {}) {
  const browsingRulesStorageService = BrowsingRulesStorageService.createFake()
  await browsingRulesStorageService.save(browsingRules)

  const weeklyScheduleStorageService = WeeklyScheduleStorageService.createFake()
  await weeklyScheduleStorageService.saveAll(schedules)

  const browsingControlService = new FakeBrowsingControlService()

  const blockingTimerIntegration: BlockingTimerIntegration = {
    pauseBlockingDuringBreaks,
    pauseBlockingWhenTimerNotRunning
  }
  const blockingTimerIntegrationStorageService = BlockingTimerIntegrationStorageService.createFake()
  await blockingTimerIntegrationStorageService.save(blockingTimerIntegration)

  const focusSessionRecordStorageService = FocusSessionRecordStorageService.createFake()
  await focusSessionRecordStorageService.saveAll(focusSessionRecords)

  const browsingControlTogglingService = BrowsingControlTogglingService.createFake({
    browsingRulesStorageService,
    browsingControlService,
    weeklyScheduleStorageService,
    blockingTimerIntegrationStorageService,
    focusSessionRecordStorageService,
    timerInfoGetter: { getTimerInfo: () => timerInfo }
  })

  await browsingControlTogglingService.run()

  return browsingControlService.getActivatedBrowsingRules()
}
