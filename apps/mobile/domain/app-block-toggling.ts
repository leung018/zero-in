import { ScheduleSpan } from '@zero-in/shared/domain/schedules'
import { TimerStage } from '@zero-in/shared/domain/timer/stage'
import { isInBreak, TimerInfoGetter } from '../../../packages/shared/src/domain/blocking-toggling'
import { WeeklySchedulesStorageService } from '../../../packages/shared/src/domain/schedules/storage'
import { TimerBasedBlockingRulesStorageService } from '../../../packages/shared/src/domain/timer-based-blocking/storage'
import { FocusSessionRecordsStorageService } from '../../../packages/shared/src/domain/timer/record/storage'
import { getDateAfter, maxDate } from '../../../packages/shared/src/utils/date'
import { AppBlocker } from '../infra/app-block/interface'
import { findActiveOrNextScheduleSpan } from './schedules/schedule-span'

interface AsyncTimerInfoGetter {
  getTimerInfo: () => Promise<ReturnType<TimerInfoGetter['getTimerInfo']>>
}

export class AppBlockTogglingService {
  private weeklySchedulesStorageService: WeeklySchedulesStorageService
  private focusSessionRecordsStorageService: FocusSessionRecordsStorageService
  private appBlockerWrapper: AppBlockerWrapper
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
    this.appBlockerWrapper = new AppBlockerWrapper(appBlocker)
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

    if (
      !timerBasedBlockingRules.pauseBlockingDuringBreaks &&
      timerBasedBlockingRules.pauseBlockingWhenTimerNotRunning
    ) {
      if (!timerInfo.isRunning) {
        return this.appBlockerWrapper.disableAllBlocking()
      }

      if (!scheduleSpan) {
        return this.appBlockerWrapper.enableAlwaysBlock()
      }

      if (scheduleSpan.isContain(new Date())) {
        return this.appBlockerWrapper.setBlockingSchedule(
          new ScheduleSpan({
            start: new Date(),
            end: getDateAfter({ duration: timerInfo.remaining })
          })
        )
      }
      return this.appBlockerWrapper.disableAllBlocking()
    }

    if (
      timerBasedBlockingRules.pauseBlockingDuringBreaks &&
      !timerBasedBlockingRules.pauseBlockingWhenTimerNotRunning
    ) {
      if (isInBreak(timerInfo)) {
        if (scheduleSpan && timerInfo.isRunning) {
          return this.appBlockerWrapper.setBlockingSchedule(
            new ScheduleSpan({
              start: maxDate(getDateAfter({ duration: timerInfo.remaining }), scheduleSpan.start),
              end: scheduleSpan.end
            })
          )
        }
        return this.appBlockerWrapper.disableAllBlocking()
      }
    }

    if (
      timerBasedBlockingRules.pauseBlockingDuringBreaks &&
      timerBasedBlockingRules.pauseBlockingWhenTimerNotRunning
    ) {
      if (timerInfo.isRunning && timerInfo.timerStage === TimerStage.FOCUS) {
        return this.appBlockerWrapper.setBlockingSchedule(
          new ScheduleSpan({
            start: new Date(),
            end: getDateAfter({ duration: timerInfo.remaining })
          })
        )
      }

      return this.appBlockerWrapper.disableAllBlocking()
    }

    if (scheduleSpan) {
      return this.appBlockerWrapper.setBlockingSchedule(scheduleSpan)
    }
    return this.appBlockerWrapper.enableAlwaysBlock()
  }
}

class AppBlockerWrapper {
  // Be careful about sequences of calls to the app blocker in this class.
  // Unit testing may not cover issues arising from improper sequences of calls.

  constructor(private appBlocker: AppBlocker) {}

  async setBlockingSchedule(scheduleSpan: ScheduleSpan) {
    await this.appBlocker.disableAlwaysBlock()
    await this.appBlocker.setBlockingSchedule(scheduleSpan)
    return scheduleSpan
  }

  async enableAlwaysBlock() {
    await this.appBlocker.clearBlockingSchedule()
    await this.appBlocker.enableAlwaysBlock()
  }

  async disableAllBlocking() {
    await this.appBlocker.clearBlockingSchedule()
    await this.appBlocker.disableAlwaysBlock()
  }
}
