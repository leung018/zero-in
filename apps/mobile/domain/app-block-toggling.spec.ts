import { BlockingState, FakeAppBlocker } from '@/infra/app-block/interface'
import { WeeklySchedule } from '@zero-in/shared/domain/schedules/index'
import { WeeklySchedulesStorageService } from '@zero-in/shared/domain/schedules/storage'
import { Weekday } from '@zero-in/shared/domain/schedules/weekday'
import { Time } from '@zero-in/shared/domain/time'
import { TimerInfoGetter } from '../../../packages/shared/src/domain/blocking-toggling'
import { newTestTimerBasedBlockingRules } from '../../../packages/shared/src/domain/timer-based-blocking'
import { TimerBasedBlockingRulesStorageService } from '../../../packages/shared/src/domain/timer-based-blocking/storage'
import { Duration } from '../../../packages/shared/src/domain/timer/duration'
import {
  FocusSessionRecord,
  newFocusSessionRecord
} from '../../../packages/shared/src/domain/timer/record'
import { FocusSessionRecordsStorageService } from '../../../packages/shared/src/domain/timer/record/storage'
import { TimerStage } from '../../../packages/shared/src/domain/timer/stage'
import { AppBlockTogglingService } from './app-block-toggling'

describe('AppBlockTogglingService', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('when pauseBlockingDuringBreaks and pauseBlockingWhenTimerNotRunning are both false', () => {
    it('should set app blocking schedule only if weekly schedule is set', async () => {
      jest.setSystemTime(new Date('2026-01-05T08:00:00')) // 2026-01-05 is Monday
      const { weeklySchedulesStorageService, appBlocker, togglingService } =
        await runAppBlockToggling({
          weeklySchedules: [
            new WeeklySchedule({
              weekdaySet: new Set([Weekday.MON]),
              startTime: new Time(9, 0),
              endTime: new Time(17, 0)
            })
          ],
          timerBasedBlockingRules: newTestTimerBasedBlockingRules({
            pauseBlockingDuringBreaks: false,
            pauseBlockingWhenTimerNotRunning: false
          })
        })

      expect(appBlocker.getBlockingState()).toEqual(
        newScheduledBlockingState({
          start: new Date('2026-01-05T09:00:00'),
          end: new Date('2026-01-05T17:00:00')
        })
      )

      // After removing schedule, it should enable always block
      await weeklySchedulesStorageService.save([])
      await togglingService.run()

      expect(appBlocker.getBlockingState()).toEqual({ kind: 'always' })
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
          weeklySchedules: [
            new WeeklySchedule({
              weekdaySet: new Set([Weekday.MON, Weekday.TUE]),
              startTime: new Time(9, 0),
              endTime: new Time(17, 0),
              targetFocusSessions: 2
            })
          ],
          focusSessionRecords,
          timerBasedBlockingRules: newTestTimerBasedBlockingRules({
            pauseBlockingDuringBreaks: false,
            pauseBlockingWhenTimerNotRunning: false
          })
        })

      expect(appBlocker.getBlockingState()).toEqual(
        newScheduledBlockingState({
          start: new Date('2026-01-05T09:00:00'),
          end: new Date('2026-01-05T17:00:00')
        })
      )

      // After adding another completed focus session within Monday schedule, it should consider the schedule as completed
      focusSessionRecords.push(
        newFocusSessionRecord({
          completedAt: new Date('2026-01-05T11:00:00')
        })
      )
      await focusSessionRecordsStorageService.save(focusSessionRecords)

      await togglingService.run()

      expect(appBlocker.getBlockingState()).toEqual(
        newScheduledBlockingState({
          start: new Date('2026-01-06T09:00:00'),
          end: new Date('2026-01-06T17:00:00')
        })
      )
    })

    it('should always block app only if no schedule is set', async () => {
      const { appBlocker, weeklySchedulesStorageService, togglingService } =
        await runAppBlockToggling({
          weeklySchedules: [],
          timerBasedBlockingRules: newTestTimerBasedBlockingRules({
            pauseBlockingDuringBreaks: false,
            pauseBlockingWhenTimerNotRunning: false
          })
        })

      expect(appBlocker.getBlockingState()).toEqual({ kind: 'always' })

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

      expect(appBlocker.getBlockingState().kind).toEqual('scheduled')
    })
  })

  describe('when pauseBlockingDuringBreaks is false and pauseBlockingWhenTimerNotRunning is true', () => {
    it('should disable all blocking when timer is not running', async () => {
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
          isRunning: false
        })
      })

      expect(appBlocker.getBlockingState()).toEqual({ kind: 'none' })
    })

    it('should set blocking schedule from now to session end when timer is running and within the schedule', async () => {
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
          isRunning: true,
          remaining: new Duration({ minutes: 25 })
        })
      })

      expect(appBlocker.getBlockingState()).toEqual(
        newScheduledBlockingState({
          start: new Date('2026-01-05T10:00:00'),
          end: new Date('2026-01-05T10:25:00')
        })
      )
    })

    it('should not enable any blocking schedule when timer is running and session not within the schedule', async () => {
      jest.setSystemTime(new Date('2026-01-05T18:00:00')) // 2026-01-05 is Monday

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
          isRunning: true,
          remaining: new Duration({ minutes: 25 })
        })
      })

      expect(appBlocker.getBlockingState()).toEqual({ kind: 'none' })
    })

    it('should enable always block when timer is running and no schedule span', async () => {
      const { appBlocker } = await runAppBlockToggling({
        timerBasedBlockingRules: newTestTimerBasedBlockingRules({
          pauseBlockingDuringBreaks: false,
          pauseBlockingWhenTimerNotRunning: true
        }),
        weeklySchedules: [],
        timerInfo: newTimerInfo({
          isRunning: true
        })
      })

      expect(appBlocker.getBlockingState()).toEqual({ kind: 'always' })
    })
  })

  describe('when pauseBlockingDuringBreaks is true and pauseBlockingWhenTimerNotRunning is false', () => {
    it.each([TimerStage.LONG_BREAK, TimerStage.SHORT_BREAK])(
      'should set blocking schedule from break end to weekly schedule end when timer is running in break (%s) and within the schedule',
      async (breakStage) => {
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
            timerStage: breakStage,
            isRunning: true,
            remaining: new Duration({ minutes: 5 })
          })
        })

        expect(appBlocker.getBlockingState()).toEqual(
          newScheduledBlockingState({
            start: new Date('2026-01-05T10:05:00'),
            end: new Date('2026-01-05T17:00:00')
          })
        )
      }
    )

    it('should set blocking schedule according to weekly schedule when timer is running in break but not within the schedule', async () => {
      jest.setSystemTime(new Date('2026-01-05T18:00:00')) // 2026-01-05 is Monday
      const { appBlocker } = await runAppBlockToggling({
        timerBasedBlockingRules: newTestTimerBasedBlockingRules({
          pauseBlockingDuringBreaks: true,
          pauseBlockingWhenTimerNotRunning: false
        }),
        weeklySchedules: [
          new WeeklySchedule({
            weekdaySet: new Set([Weekday.TUE]),
            startTime: new Time(9, 0),
            endTime: new Time(17, 0)
          })
        ],
        timerInfo: newTimerInfo({
          timerStage: TimerStage.SHORT_BREAK,
          isRunning: true,
          remaining: new Duration({ minutes: 5 })
        })
      })

      expect(appBlocker.getBlockingState()).toEqual(
        newScheduledBlockingState({
          start: new Date('2026-01-06T09:00:00'),
          end: new Date('2026-01-06T17:00:00')
        })
      )
    })

    it.each([TimerStage.LONG_BREAK, TimerStage.SHORT_BREAK])(
      'should unblock when timer is paused during break (%s)',
      async (breakStage) => {
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
            timerStage: breakStage,
            isRunning: false,
            remaining: new Duration({ minutes: 4, seconds: 59 })
          })
        })
        expect(appBlocker.getBlockingState()).toEqual({ kind: 'none' })
      }
    )

    it.each([true, false])(
      'should set blocking schedule according to weekly schedule end when timer is not in break',
      async (isRunning) => {
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
            timerStage: TimerStage.FOCUS,
            isRunning
          })
        })

        expect(appBlocker.getBlockingState()).toEqual(
          newScheduledBlockingState({
            start: new Date('2026-01-05T09:00:00'),
            end: new Date('2026-01-05T17:00:00')
          })
        )
      }
    )
  })

  describe('when both pauseBlockingDuringBreaks and pauseBlockingWhenTimerNotRunning are true', () => {
    it('should disable blocking when timer is not running in focus', async () => {
      jest.setSystemTime(new Date('2026-01-05T10:00:00')) // 2026-01-05 is Monday
      const { appBlocker } = await runAppBlockToggling({
        timerBasedBlockingRules: newTestTimerBasedBlockingRules({
          pauseBlockingDuringBreaks: true,
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
          isRunning: false
        })
      })

      expect(appBlocker.getBlockingState()).toEqual({ kind: 'none' })
    })

    it('should set blocking schedule from now to session end when timer is running in focus', async () => {
      jest.setSystemTime(new Date('2026-01-05T10:00:00')) // 2026-01-05 is Monday
      const { appBlocker } = await runAppBlockToggling({
        timerBasedBlockingRules: newTestTimerBasedBlockingRules({
          pauseBlockingDuringBreaks: true,
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

      expect(appBlocker.getBlockingState()).toEqual(
        newScheduledBlockingState({
          start: new Date('2026-01-05T10:00:00'),
          end: new Date('2026-01-05T10:25:00')
        })
      )
    })

    it.each([TimerStage.SHORT_BREAK, TimerStage.LONG_BREAK])(
      'should disable blocking when timer is running in break',
      async (timerStage) => {
        const { appBlocker } = await runAppBlockToggling({
          timerBasedBlockingRules: newTestTimerBasedBlockingRules({
            pauseBlockingDuringBreaks: true,
            pauseBlockingWhenTimerNotRunning: true
          }),
          weeklySchedules: [],
          timerInfo: newTimerInfo({
            timerStage,
            isRunning: true
          })
        })
        expect(appBlocker.getBlockingState()).toEqual({ kind: 'none' })
      }
    )
  })

  it('should run return schedule span of scheduledBlockingState if any', async () => {
    jest.setSystemTime(new Date('2026-01-05T10:00:00')) // 2026-01-05 is Monday
    const { togglingService } = await runAppBlockToggling({
      weeklySchedules: [
        new WeeklySchedule({
          weekdaySet: new Set([Weekday.MON]),
          startTime: new Time(9, 0),
          endTime: new Time(17, 0)
        })
      ],
      timerBasedBlockingRules: newTestTimerBasedBlockingRules({
        pauseBlockingDuringBreaks: false,
        pauseBlockingWhenTimerNotRunning: false
      })
    })
    const result = await togglingService.run()

    expect(result).toEqual({
      start: new Date('2026-01-05T09:00:00'),
      end: new Date('2026-01-05T17:00:00')
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
} = {}) {
  const weeklySchedulesStorageService = WeeklySchedulesStorageService.createFake()
  const focusSessionRecordsStorageService = FocusSessionRecordsStorageService.createFake()
  const timerBasedBlockingRulesStorageService = TimerBasedBlockingRulesStorageService.createFake()
  const appBlocker = new FakeAppBlocker()
  const togglingService = new AppBlockTogglingService({
    weeklySchedulesStorageService,
    focusSessionRecordsStorageService,
    appBlocker,
    timerInfoGetter: {
      getTimerInfo: () => Promise.resolve(timerInfo)
    },
    timerBasedBlockingRulesStorageService
  })

  await weeklySchedulesStorageService.save(weeklySchedules)
  await focusSessionRecordsStorageService.save(focusSessionRecords)
  await timerBasedBlockingRulesStorageService.save(timerBasedBlockingRules)

  await togglingService.run()

  return {
    weeklySchedulesStorageService,
    appBlocker,
    togglingService,
    focusSessionRecordsStorageService
  }
}

function newScheduledBlockingState({ start, end }: { start: Date; end: Date }): BlockingState {
  return {
    kind: 'scheduled',
    scheduleSpan: {
      start,
      end
    }
  }
}
