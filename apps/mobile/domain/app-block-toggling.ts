import { AppBlocker } from '@/infra/app-block/app-blocker'
import { ScheduleSpan } from '@zero-in/shared/domain/schedules'
import { TimerStage } from '@zero-in/shared/domain/timer/stage'
import { isInBreak, TimerInfoGetter } from '../../../packages/shared/src/domain/blocking-toggling'
import { WeeklySchedulesStorageService } from '../../../packages/shared/src/domain/schedules/storage'
import { TimerBasedBlockingRulesStorageService } from '../../../packages/shared/src/domain/timer-based-blocking/storage'
import { Duration } from '../../../packages/shared/src/domain/timer/duration'
import { FocusSessionRecordsStorageService } from '../../../packages/shared/src/domain/timer/record/storage'
import { getDateAfter, maxDate, minDate } from '../../../packages/shared/src/utils/date'
import { findActiveOrNextScheduleSpan } from './schedules/schedule-span'

interface AsyncTimerInfoGetter {
  getTimerInfo: () => Promise<ReturnType<TimerInfoGetter['getTimerInfo']>>
}

export class AppBlockTogglingService {
  private weeklySchedulesStorageService: WeeklySchedulesStorageService
  private focusSessionRecordsStorageService: FocusSessionRecordsStorageService
  private appBlocker: AppBlocker
  private timerInfoGetter: AsyncTimerInfoGetter
  private timerBasedBlockingRulesStorageService: TimerBasedBlockingRulesStorageService

  constructor({
    weeklySchedulesStorageService,
    focusSessionRecordsStorageService,
    appBlocker,
    timerInfoGetter,
    timerBasedBlockingRulesStorageService
  }: {
    weeklySchedulesStorageService: WeeklySchedulesStorageService
    focusSessionRecordsStorageService: FocusSessionRecordsStorageService
    appBlocker: AppBlocker
    timerInfoGetter: AsyncTimerInfoGetter
    timerBasedBlockingRulesStorageService: TimerBasedBlockingRulesStorageService
  }) {
    this.weeklySchedulesStorageService = weeklySchedulesStorageService
    this.focusSessionRecordsStorageService = focusSessionRecordsStorageService
    this.appBlocker = appBlocker
    this.timerInfoGetter = timerInfoGetter
    this.timerBasedBlockingRulesStorageService = timerBasedBlockingRulesStorageService
  }

  async run() {
    const [timerBasedBlockingRules, timerInfo, weeklySchedules, focusSessionRecords] =
      await Promise.all([
        this.timerBasedBlockingRulesStorageService.get(),
        this.timerInfoGetter.getTimerInfo(),
        this.weeklySchedulesStorageService.get(),
        this.focusSessionRecordsStorageService.get()
      ])

    const scheduleSpan = findActiveOrNextScheduleSpan({
      schedules: weeklySchedules,
      focusSessionRecords: focusSessionRecords
    })

    // TODO: Refactor below

    if (
      !timerBasedBlockingRules.pauseBlockingDuringBreaks &&
      timerBasedBlockingRules.pauseBlockingWhenTimerNotRunning
    ) {
      if (!timerInfo.isRunning) {
        return this.appBlocker.disableAllBlocking()
      }

      if (!scheduleSpan || scheduleSpan.isContain(new Date())) {
        return this.appBlocker.setBlockingSchedule(
          clampScheduleSpanToRemaining(timerInfo.remaining, scheduleSpan)
        )
      }
      return this.appBlocker.disableAllBlocking()
    }

    if (
      timerBasedBlockingRules.pauseBlockingDuringBreaks &&
      !timerBasedBlockingRules.pauseBlockingWhenTimerNotRunning
    ) {
      if (isInBreak(timerInfo)) {
        if (scheduleSpan && timerInfo.isRunning) {
          return this.appBlocker.setBlockingSchedule(
            new ScheduleSpan({
              start: maxDate(getDateAfter({ duration: timerInfo.remaining }), scheduleSpan.start),
              end: scheduleSpan.end
            })
          )
        }
        return this.appBlocker.disableAllBlocking()
      }
    }

    if (
      timerBasedBlockingRules.pauseBlockingDuringBreaks &&
      timerBasedBlockingRules.pauseBlockingWhenTimerNotRunning
    ) {
      if (timerInfo.isRunning && timerInfo.timerStage === TimerStage.FOCUS) {
        if (!scheduleSpan || scheduleSpan.isContain(new Date())) {
          return this.appBlocker.setBlockingSchedule(
            clampScheduleSpanToRemaining(timerInfo.remaining, scheduleSpan)
          )
        }
      }

      return this.appBlocker.disableAllBlocking()
    }

    if (scheduleSpan) {
      return this.appBlocker.setBlockingSchedule(scheduleSpan)
    }
    return this.appBlocker.enableAlwaysBlock()
  }
}

function clampScheduleSpanToRemaining(remaining: Duration, scheduleSpan: ScheduleSpan | null) {
  const start = new Date()
  const sessionEnd = getDateAfter({ from: start, duration: remaining })
  return new ScheduleSpan({
    start,
    end: scheduleSpan ? minDate(sessionEnd, scheduleSpan.end) : sessionEnd
  })
}
