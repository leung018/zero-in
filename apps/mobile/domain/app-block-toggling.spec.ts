import { FakeAppBlocker } from '@/infra/app-block/interface'
import { TimerInfoGetter } from '@zero-in/shared/domain/blocking-toggling'
import { WeeklySchedule } from '@zero-in/shared/domain/schedules/index'
import { WeeklySchedulesStorageService } from '@zero-in/shared/domain/schedules/storage'
import { Weekday } from '@zero-in/shared/domain/schedules/weekday'
import { Time } from '@zero-in/shared/domain/time'
import {
  newTestTimerBasedBlockingRules,
  TimerBasedBlockingRules
} from '@zero-in/shared/domain/timer-based-blocking'
import { TimerBasedBlockingRulesStorageService } from '@zero-in/shared/domain/timer-based-blocking/storage'
import { Duration } from '@zero-in/shared/domain/timer/duration'
import { TimerStage } from '@zero-in/shared/domain/timer/stage'
import {
  FocusSessionRecord,
  newFocusSessionRecord
} from '../../../packages/shared/src/domain/timer/record'
import { FocusSessionRecordsStorageService } from '../../../packages/shared/src/domain/timer/record/storage'
import { AppBlockTogglingService } from './app-block-toggling'

describe('AppBlockTogglingService', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should set app blocking schedule only if weekly schedule is set', async () => {
    jest.setSystemTime(new Date('2026-01-05T08:00:00')) // 2026-01-05 is Monday
    const { weeklySchedulesStorageService, appBlocker, togglingService } =
      await runAppBlockToggling({
        timerBasedBlockingRules: newTestTimerBasedBlockingRules({
          pauseBlockingDuringBreaks: false,
          pauseBlockingWhenTimerNotRunning: false
        }),
        weeklySchedules: [
          new WeeklySchedule({
            weekdaySet: new Set([Weekday.MON]),
            startTime: new Time(9, 0),
            endTime: new Time(17, 0)
          })
        ]
      })

    expect(appBlocker.getBlockingScheduleSpan()).toEqual({
      start: new Date('2026-01-05T09:00:00'),
      end: new Date('2026-01-05T17:00:00')
    })

    // After removing schedule, it should also cleared the blockingScheduleSpan
    await weeklySchedulesStorageService.save([])
    await togglingService.run()

    expect(appBlocker.getBlockingScheduleSpan()).toBeNull()
  })

  it('should only consider schedules that have not completed target focus sessions', async () => {
    jest.setSystemTime(new Date('2026-01-05T12:00:00')) // 2026-01-05 is Monday
    const focusSessionRecords: FocusSessionRecord[] = [
      newFocusSessionRecord({
        completedAt: new Date('2026-01-04T10:00:00')
      }),
      newFocusSessionRecord({
        completedAt: new Date('2026-01-05T10:00:00')
      })
    ]

    const { appBlocker, focusSessionRecordsStorageService, togglingService } =
      await runAppBlockToggling({
        timerBasedBlockingRules: newTestTimerBasedBlockingRules({
          pauseBlockingDuringBreaks: false,
          pauseBlockingWhenTimerNotRunning: false
        }),
        weeklySchedules: [
          new WeeklySchedule({
            weekdaySet: new Set([Weekday.MON, Weekday.TUE]),
            startTime: new Time(9, 0),
            endTime: new Time(17, 0),
            targetFocusSessions: 2
          })
        ],
        focusSessionRecords
      })

    expect(appBlocker.getBlockingScheduleSpan()).toEqual({
      start: new Date('2026-01-05T09:00:00'),
      end: new Date('2026-01-05T17:00:00')
    })

    // After adding another completed focus session within Monday schedule, it should consider the schedule as completed
    focusSessionRecords.push(
      newFocusSessionRecord({
        completedAt: new Date('2026-01-05T11:00:00')
      })
    )
    await focusSessionRecordsStorageService.save(focusSessionRecords)

    await togglingService.run()

    expect(appBlocker.getBlockingScheduleSpan()).toEqual({
      start: new Date('2026-01-06T09:00:00'),
      end: new Date('2026-01-06T17:00:00')
    })
  })

  it('should always block app only if no schedule is set', async () => {
    const { appBlocker, weeklySchedulesStorageService, togglingService } =
      await runAppBlockToggling({
        timerBasedBlockingRules: newTestTimerBasedBlockingRules({
          pauseBlockingDuringBreaks: false,
          pauseBlockingWhenTimerNotRunning: false
        }),
        weeklySchedules: []
      })

    expect(appBlocker.getBlockingScheduleSpan()).toBeNull()
    expect(appBlocker.getIsAppBlocked()).toBe(true)

    // After setting a non current schedule, it should unblock app
    await weeklySchedulesStorageService.save([
      new WeeklySchedule({
        weekdaySet: new Set([Weekday.MON]),
        startTime: new Time(9, 0),
        endTime: new Time(17, 0)
      })
    ])

    jest.setSystemTime(new Date('2026-01-05T08:00:00')) // 2026-01-05 is Monday
    await togglingService.run()

    expect(appBlocker.getBlockingScheduleSpan()).not.toBeNull()
    expect(appBlocker.getIsAppBlocked()).toBe(false)
  })

  it('should unblock when timer is not running and pauseBlockingWhenTimerNotRunning is enabled', async () => {
    jest.setSystemTime(new Date('2026-01-05T10:00:00')) // 2026-01-05 is Monday
    const { appBlocker } = await runAppBlockToggling({
      timerBasedBlockingRules: newTestTimerBasedBlockingRules({
        pauseBlockingDuringBreaks: false,
        pauseBlockingWhenTimerNotRunning: true
      }),
      weeklySchedules: [
        new WeeklySchedule({
          weekdaySet: new Set([Weekday.MON]),
          startTime: new Time(9, 0),
          endTime: new Time(17, 0)
        })
      ],
      timerInfo: newTimerInfo({
        timerStage: TimerStage.FOCUS,
        isRunning: false,
        remaining: new Duration({ minutes: 25 })
      })
    })

    expect(appBlocker.getBlockingScheduleSpan()).toBeNull()
  })

  it('should set scheduleSpan from now to session end when timer is running and pauseBlockingWhenTimerNotRunning is enabled', async () => {
    jest.setSystemTime(new Date('2026-01-05T10:00:00')) // 2026-01-05 is Monday

    const { appBlocker } = await runAppBlockToggling({
      timerBasedBlockingRules: newTestTimerBasedBlockingRules({
        pauseBlockingDuringBreaks: false,
        pauseBlockingWhenTimerNotRunning: true
      }),
      weeklySchedules: [
        new WeeklySchedule({
          weekdaySet: new Set([Weekday.MON]),
          startTime: new Time(9, 0),
          endTime: new Time(17, 0)
        })
      ],
      timerInfo: newTimerInfo({
        timerStage: TimerStage.FOCUS,
        isRunning: true,
        remaining: new Duration({ minutes: 25 })
      })
    })

    expect(appBlocker.getBlockingScheduleSpan()).toEqual({
      start: new Date('2026-01-05T10:00:00'),
      end: new Date('2026-01-05T10:25:00')
    })
  })

  describe('when pauseBlockingWhenTimerNotRunning is disabled', () => {
    it('should set scheduleSpan from break end to schedule end when pauseBlockingDuringBreaks is enabled and timer is in break', async () => {
      jest.setSystemTime(new Date('2026-01-05T10:00:00')) // 2026-01-05 is Monday
      const { appBlocker } = await runAppBlockToggling({
        timerBasedBlockingRules: newTestTimerBasedBlockingRules({
          pauseBlockingDuringBreaks: true,
          pauseBlockingWhenTimerNotRunning: false
        }),
        weeklySchedules: [
          new WeeklySchedule({
            weekdaySet: new Set([Weekday.MON]),
            startTime: new Time(9, 0),
            endTime: new Time(17, 0)
          })
        ],
        timerInfo: newTimerInfo({
          timerStage: TimerStage.SHORT_BREAK,
          isRunning: true,
          remaining: new Duration({ minutes: 5 }),
          shortBreak: new Duration({ minutes: 5 })
        })
      })

      expect(appBlocker.getBlockingScheduleSpan()).toEqual({
        start: new Date('2026-01-05T10:05:00'),
        end: new Date('2026-01-05T17:00:00')
      })
    })

    it('should unblock when timer is paused during break and pauseBlockingDuringBreaks is enabled', async () => {
      jest.setSystemTime(new Date('2026-01-05T10:00:00')) // 2026-01-05 is Monday
      const { appBlocker } = await runAppBlockToggling({
        timerBasedBlockingRules: newTestTimerBasedBlockingRules({
          pauseBlockingDuringBreaks: true,
          pauseBlockingWhenTimerNotRunning: false
        }),
        weeklySchedules: [
          new WeeklySchedule({
            weekdaySet: new Set([Weekday.MON]),
            startTime: new Time(9, 0),
            endTime: new Time(17, 0)
          })
        ],
        timerInfo: newTimerInfo({
          timerStage: TimerStage.SHORT_BREAK,
          isRunning: false,
          remaining: new Duration({ minutes: 4, seconds: 59 }),
          shortBreak: new Duration({ minutes: 5 })
        })
      })

      expect(appBlocker.getBlockingScheduleSpan()).toBeNull()
    })
  })
})

type TimerInfo = ReturnType<TimerInfoGetter['getTimerInfo']>

function newTimerInfo({
  timerStage = TimerStage.FOCUS,
  isRunning = false,
  remaining = new Duration({ minutes: 20 }),
  longBreak = new Duration({ minutes: 10 }),
  shortBreak = new Duration({ minutes: 5 })
}: {
  timerStage?: TimerStage
  isRunning?: boolean
  remaining?: Duration
  longBreak?: Duration
  shortBreak?: Duration
} = {}): TimerInfo {
  return {
    timerStage,
    isRunning,
    remaining,
    longBreak,
    shortBreak
  }
}

async function runAppBlockToggling({
  weeklySchedules = [
    new WeeklySchedule({
      weekdaySet: new Set([Weekday.MON]),
      startTime: new Time(9, 0),
      endTime: new Time(17, 0)
    })
  ],
  focusSessionRecords = [newFocusSessionRecord()],
  timerBasedBlockingRules = newTestTimerBasedBlockingRules({
    pauseBlockingDuringBreaks: false,
    pauseBlockingWhenTimerNotRunning: false
  }),
  timerInfo = newTimerInfo()
}: {
  weeklySchedules?: WeeklySchedule[]
  focusSessionRecords?: FocusSessionRecord[]
  timerBasedBlockingRules?: TimerBasedBlockingRules
  timerInfo?: TimerInfo
} = {}) {
  const weeklySchedulesStorageService = WeeklySchedulesStorageService.createFake()
  const focusSessionRecordsStorageService = FocusSessionRecordsStorageService.createFake()
  const timerBasedBlockingRulesStorageService = TimerBasedBlockingRulesStorageService.createFake()
  const appBlocker = new FakeAppBlocker()
  const togglingService = AppBlockTogglingService.createFake({
    weeklySchedulesStorageService,
    focusSessionRecordsStorageService,
    timerBasedBlockingRulesStorageService,
    timerInfoGetter: {
      getTimerInfo: () => timerInfo
    },
    appBlocker
  })

  await weeklySchedulesStorageService.save(weeklySchedules)
  await focusSessionRecordsStorageService.save(focusSessionRecords)
  await timerBasedBlockingRulesStorageService.save(timerBasedBlockingRules)

  const blockingScheduleSpan = await togglingService.run()

  expect(blockingScheduleSpan).toEqual(appBlocker.getBlockingScheduleSpan())

  return {
    weeklySchedulesStorageService,
    appBlocker,
    togglingService,
    focusSessionRecordsStorageService
  }
}
