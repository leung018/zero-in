import { WeeklySchedule } from '@zero-in/shared/domain/schedules'
import { WeeklySchedulesStorageService } from '@zero-in/shared/domain/schedules/storage'
import { Weekday } from '@zero-in/shared/domain/schedules/weekday'
import { Time } from '@zero-in/shared/domain/time/index'
import type { TimerBasedBlockingRules } from '@zero-in/shared/domain/timer-based-blocking/index'
import { TimerBasedBlockingRulesStorageService } from '@zero-in/shared/domain/timer-based-blocking/storage'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FakeBrowsingControlService } from '../infra/browsing-control'
import { BrowsingControlTogglingService } from './browsing-control-toggling'
import { BrowsingRules } from './browsing-rules'
import { BrowsingRulesStorageService } from './browsing-rules/storage'
import { Duration } from './timer/duration'
import { newFocusSessionRecord } from './timer/record'
import { FocusSessionRecordsStorageService } from './timer/record/storage'
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
          newFocusSessionRecord({ completedAt: new Date('2025-02-03T11:00:00') }),
          newFocusSessionRecord({ completedAt: new Date('2025-02-03T11:26:00') }),

          newFocusSessionRecord({ completedAt: new Date('2025-02-04T08:59:59') }),
          newFocusSessionRecord({ completedAt: new Date('2025-02-04T09:00:00') })
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
          newFocusSessionRecord({ completedAt: new Date('2025-02-03T09:00:00') }),
          newFocusSessionRecord({ completedAt: new Date('2025-02-03T16:59:59') })
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
        focusSessionRecords: [
          newFocusSessionRecord({ completedAt: new Date('2025-02-03T10:00:00') })
        ],
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

  const weeklySchedulesStorageService = WeeklySchedulesStorageService.createFake()
  await weeklySchedulesStorageService.save(schedules)

  const browsingControlService = new FakeBrowsingControlService()

  const timerBasedBlockingRules: TimerBasedBlockingRules = {
    pauseBlockingDuringBreaks,
    pauseBlockingWhenTimerNotRunning
  }
  const timerBasedBlockingRulesStorageService = TimerBasedBlockingRulesStorageService.createFake()
  await timerBasedBlockingRulesStorageService.save(timerBasedBlockingRules)

  const focusSessionRecordsStorageService = FocusSessionRecordsStorageService.createFake()
  await focusSessionRecordsStorageService.save(focusSessionRecords)

  const browsingControlTogglingService = BrowsingControlTogglingService.createFake({
    browsingRulesStorageService,
    browsingControlService,
    weeklySchedulesStorageService,
    timerBasedBlockingRulesStorageService,
    focusSessionRecordsStorageService,
    timerInfoGetter: { getTimerInfo: () => timerInfo }
  })

  await browsingControlTogglingService.run()

  return browsingControlService.getActivatedBrowsingRules()
}
