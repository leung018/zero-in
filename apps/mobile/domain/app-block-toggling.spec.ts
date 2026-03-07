import { FakeAppBlocker } from '@/infra/app-block/interface'
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
          weeklySchedules: [],
          timerBasedBlockingRules: newTestTimerBasedBlockingRules({
            pauseBlockingDuringBreaks: false,
            pauseBlockingWhenTimerNotRunning: false
          })
        })

      expect(appBlocker.getBlockingScheduleSpan()).toBeNull()
      expect(appBlocker.isAlwaysBlockActivated()).toBe(true)

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
      expect(appBlocker.isAlwaysBlockActivated()).toBe(false)
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

      expect(appBlocker.getBlockingScheduleSpan()).toBeNull()
      expect(appBlocker.isAlwaysBlockActivated()).toBe(false)
    })

    it('should set blocking schedule from now to session end when timer is running', async () => {
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

      expect(appBlocker.getBlockingScheduleSpan()).toEqual({
        start: new Date('2026-01-05T10:00:00'),
        end: new Date('2026-01-05T10:25:00')
      })
      expect(appBlocker.isAlwaysBlockActivated()).toBe(false)
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

      expect(appBlocker.getBlockingScheduleSpan()).toBeNull()
      expect(appBlocker.isAlwaysBlockActivated()).toBe(true)
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
