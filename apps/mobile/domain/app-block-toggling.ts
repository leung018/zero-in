import { TimerInfoGetter } from '../../../packages/shared/src/domain/blocking-toggling'
import { WeeklySchedulesStorageService } from '../../../packages/shared/src/domain/schedules/storage'
import { TimerBasedBlockingRulesStorageService } from '../../../packages/shared/src/domain/timer-based-blocking/storage'
import { FocusSessionRecordsStorageService } from '../../../packages/shared/src/domain/timer/record/storage'
import { getDateAfter } from '../../../packages/shared/src/utils/date'
import { AppBlocker } from '../infra/app-block/interface'
import { findActiveOrNextScheduleSpan, ScheduleSpan } from './schedules/schedule-span'

export class AppBlockTogglingService {
  private weeklySchedulesStorageService: WeeklySchedulesStorageService
  private focusSessionRecordsStorageService: FocusSessionRecordsStorageService
  private appBlockerWrapper: AppBlockerWrapper
  private timerInfoGetter: TimerInfoGetter
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
    timerInfoGetter: TimerInfoGetter
    timerBasedBlockingRulesStorageService: TimerBasedBlockingRulesStorageService
  }) {
    this.weeklySchedulesStorageService = weeklySchedulesStorageService
    this.focusSessionRecordsStorageService = focusSessionRecordsStorageService
    this.appBlockerWrapper = new AppBlockerWrapper(appBlocker)
    this.timerInfoGetter = timerInfoGetter
    this.timerBasedBlockingRulesStorageService = timerBasedBlockingRulesStorageService
  }

  async run() {
    const timerBasedBlockingRules = await this.timerBasedBlockingRulesStorageService.get()
    const timerInfo = this.timerInfoGetter.getTimerInfo()

    const scheduleSpan = findActiveOrNextScheduleSpan({
      schedules: await this.weeklySchedulesStorageService.get(),
      focusSessionRecords: await this.focusSessionRecordsStorageService.get()
    })

    if (
      !timerBasedBlockingRules.pauseBlockingDuringBreaks &&
      timerBasedBlockingRules.pauseBlockingWhenTimerNotRunning
    ) {
      if (timerInfo.isRunning) {
        if (scheduleSpan) {
          return this.appBlockerWrapper.setBlockingSchedule({
            start: new Date(),
            end: getDateAfter({ duration: timerInfo.remaining })
          })
        }
        return this.appBlockerWrapper.enableAlwaysBlock()
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
