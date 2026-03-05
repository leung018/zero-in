import { TimerInfoGetter } from '../../../packages/shared/src/domain/blocking-toggling'
import { WeeklySchedulesStorageService } from '../../../packages/shared/src/domain/schedules/storage'
import { TimerBasedBlockingRulesStorageService } from '../../../packages/shared/src/domain/timer-based-blocking/storage'
import { FocusSessionRecordsStorageService } from '../../../packages/shared/src/domain/timer/record/storage'
import { getDateAfter } from '../../../packages/shared/src/utils/date'
import { AppBlocker } from '../infra/app-block/interface'
import { findActiveOrNextScheduleSpan } from './schedules/schedule-span'

export class AppBlockTogglingService {
  private weeklySchedulesStorageService: WeeklySchedulesStorageService
  private focusSessionRecordsStorageService: FocusSessionRecordsStorageService
  private appBlocker: AppBlocker
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
    this.appBlocker = appBlocker
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
      if (timerInfo.isRunning && scheduleSpan) {
        return Promise.all([
          this.appBlocker.setBlockingSchedule({
            start: new Date(),
            end: getDateAfter({ duration: timerInfo.remaining })
          }),
          this.appBlocker.disableAlwaysBlock()
        ])
      }
      // TODO: Think of case without schedule span

      return Promise.all([
        this.appBlocker.clearBlockingSchedule(),
        this.appBlocker.disableAlwaysBlock()
      ])
    }

    if (scheduleSpan) {
      await Promise.all([
        this.appBlocker.disableAlwaysBlock(),
        this.appBlocker.setBlockingSchedule(scheduleSpan)
      ])
    } else {
      await Promise.all([
        this.appBlocker.clearBlockingSchedule(),
        this.appBlocker.enableAlwaysBlock()
      ])
    }
  }
}
