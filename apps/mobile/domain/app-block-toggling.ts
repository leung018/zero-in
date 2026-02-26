import { TimerInfoGetter } from '@zero-in/shared/domain/blocking-toggling'
import { TimerBasedBlockingRulesStorageService } from '@zero-in/shared/domain/timer-based-blocking/storage'
import { TimerStage } from '@zero-in/shared/domain/timer/stage'
import { WeeklySchedulesStorageService } from '../../../packages/shared/src/domain/schedules/storage'
import { Duration } from '../../../packages/shared/src/domain/timer/duration'
import { FocusSessionRecordsStorageService } from '../../../packages/shared/src/domain/timer/record/storage'
import { AppBlocker, FakeAppBlocker } from '../infra/app-block/interface'
import { findActiveOrNextScheduleSpan } from './schedules/schedule-span'

export class AppBlockTogglingService {
  private weeklySchedulesStorageService: WeeklySchedulesStorageService
  private focusSessionRecordsStorageService: FocusSessionRecordsStorageService
  private timerBasedBlockingRulesStorageService: TimerBasedBlockingRulesStorageService
  private timerInfoGetter: TimerInfoGetter
  private appBlocker: AppBlocker

  static createFake({
    weeklySchedulesStorageService = WeeklySchedulesStorageService.createFake(),
    focusSessionRecordsStorageService = FocusSessionRecordsStorageService.createFake(),
    timerBasedBlockingRulesStorageService = TimerBasedBlockingRulesStorageService.createFake(),
    timerInfoGetter = {
      getTimerInfo: () => ({
        timerStage: TimerStage.FOCUS,
        isRunning: false,
        remaining: new Duration({ seconds: 0 }),
        longBreak: new Duration({ seconds: 0 }),
        shortBreak: new Duration({ seconds: 0 })
      })
    },
    appBlocker = new FakeAppBlocker()
  }: {
    weeklySchedulesStorageService?: WeeklySchedulesStorageService
    focusSessionRecordsStorageService?: FocusSessionRecordsStorageService
    timerBasedBlockingRulesStorageService?: TimerBasedBlockingRulesStorageService
    timerInfoGetter?: TimerInfoGetter
    appBlocker?: AppBlocker
  } = {}): AppBlockTogglingService {
    return new AppBlockTogglingService({
      weeklySchedulesStorageService,
      focusSessionRecordsStorageService,
      timerBasedBlockingRulesStorageService,
      timerInfoGetter,
      appBlocker
    })
  }

  constructor({
    weeklySchedulesStorageService,
    focusSessionRecordsStorageService,
    timerBasedBlockingRulesStorageService,
    timerInfoGetter,
    appBlocker
  }: {
    weeklySchedulesStorageService: WeeklySchedulesStorageService
    focusSessionRecordsStorageService: FocusSessionRecordsStorageService
    timerBasedBlockingRulesStorageService: TimerBasedBlockingRulesStorageService
    timerInfoGetter: TimerInfoGetter
    appBlocker: AppBlocker
  }) {
    this.weeklySchedulesStorageService = weeklySchedulesStorageService
    this.focusSessionRecordsStorageService = focusSessionRecordsStorageService
    this.timerBasedBlockingRulesStorageService = timerBasedBlockingRulesStorageService
    this.timerInfoGetter = timerInfoGetter
    this.appBlocker = appBlocker
  }

  async run() {
    const scheduleSpan = findActiveOrNextScheduleSpan({
      schedules: await this.weeklySchedulesStorageService.get(),
      focusSessionRecords: await this.focusSessionRecordsStorageService.get()
    })
    if (scheduleSpan) {
      await Promise.all([this.appBlocker.unblockApps(), this.appBlocker.setSchedule(scheduleSpan)])
    } else {
      await Promise.all([this.appBlocker.clearSchedule(), this.appBlocker.blockApps()])
    }

    return scheduleSpan
  }
}
