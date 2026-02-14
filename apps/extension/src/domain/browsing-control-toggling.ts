import { isScheduleCompleteTarget } from '@zero-in/shared/domain/is-schedule-complete-target'
import { WeeklySchedule } from '@zero-in/shared/domain/schedules/index'
import { WeeklySchedulesStorageService } from '@zero-in/shared/domain/schedules/storage'
import { getWeekdayFromDate } from '@zero-in/shared/domain/schedules/weekday'
import { TimerBasedBlockingRulesStorageService } from '@zero-in/shared/domain/timer-based-blocking/storage'
import { Duration } from '@zero-in/shared/domain/timer/duration'
import { FocusSessionRecordsStorageService } from '@zero-in/shared/domain/timer/record/storage'
import { TimerStage } from '@zero-in/shared/domain/timer/stage'
import { FakeBrowsingControlService, type BrowsingControlService } from '../infra/browsing-control'
import { BrowsingRulesStorageService } from './browsing-rules/storage'

interface TimerInfoGetter {
  getTimerInfo(): {
    timerStage: TimerStage
    isRunning: boolean
    remaining: Duration
    longBreak: Duration
    shortBreak: Duration
  }
}

export class BrowsingControlTogglingService {
  private browsingControlService: BrowsingControlService
  private browsingRulesStorageService: BrowsingRulesStorageService
  private weeklySchedulesStorageService: WeeklySchedulesStorageService
  private focusSessionRecordsStorageService: FocusSessionRecordsStorageService
  private timerBasedBlockingRulesStorageService: TimerBasedBlockingRulesStorageService
  private timerInfoGetter: TimerInfoGetter

  static createFake({
    browsingControlService = new FakeBrowsingControlService(),
    browsingRulesStorageService = BrowsingRulesStorageService.createFake(),
    weeklySchedulesStorageService = WeeklySchedulesStorageService.createFake(),
    timerBasedBlockingRulesStorageService = TimerBasedBlockingRulesStorageService.createFake(),
    focusSessionRecordsStorageService = FocusSessionRecordsStorageService.createFake(),
    timerInfoGetter = {
      getTimerInfo: () => ({
        timerStage: TimerStage.FOCUS,
        isRunning: false,
        remaining: new Duration({ seconds: 0 }),
        longBreak: new Duration({ seconds: 0 }),
        shortBreak: new Duration({ seconds: 0 })
      })
    }
  } = {}) {
    return new BrowsingControlTogglingService({
      browsingControlService,
      browsingRulesStorageService,
      weeklySchedulesStorageService,
      timerBasedBlockingRulesStorageService,
      focusSessionRecordsStorageService,
      timerInfoGetter
    })
  }

  constructor({
    browsingControlService,
    browsingRulesStorageService,
    focusSessionRecordsStorageService,
    weeklySchedulesStorageService,
    timerBasedBlockingRulesStorageService,
    timerInfoGetter
  }: {
    browsingControlService: BrowsingControlService
    browsingRulesStorageService: BrowsingRulesStorageService
    focusSessionRecordsStorageService: FocusSessionRecordsStorageService
    weeklySchedulesStorageService: WeeklySchedulesStorageService
    timerBasedBlockingRulesStorageService: TimerBasedBlockingRulesStorageService
    timerInfoGetter: TimerInfoGetter
  }) {
    this.browsingControlService = browsingControlService
    this.browsingRulesStorageService = browsingRulesStorageService
    this.weeklySchedulesStorageService = weeklySchedulesStorageService
    this.focusSessionRecordsStorageService = focusSessionRecordsStorageService
    this.timerBasedBlockingRulesStorageService = timerBasedBlockingRulesStorageService
    this.timerInfoGetter = timerInfoGetter
  }

  async run(): Promise<void> {
    if (await this.shouldActivateBlocking()) {
      const browsingRules = await this.browsingRulesStorageService.get()
      return this.browsingControlService.setAndActivateNewRules(browsingRules)
    }
    return this.browsingControlService.deactivateExistingRules()
  }

  async shouldActivateBlocking(): Promise<boolean> {
    const timerBasedBlockingRules = await this.timerBasedBlockingRulesStorageService.get()

    if (timerBasedBlockingRules.pauseBlockingWhenTimerNotRunning && !this.isRunning()) {
      return false
    }

    if (timerBasedBlockingRules.pauseBlockingDuringBreaks && this.isInBreak()) {
      return false
    }

    const schedules = await this.weeklySchedulesStorageService.get()

    if (schedules.length === 0) {
      return true
    }

    return this.isAnyScheduleActive(schedules)
  }

  private async isAnyScheduleActive(
    inputSchedules: ReadonlyArray<WeeklySchedule>
  ): Promise<boolean> {
    const now = new Date()

    const schedules = inputSchedules.filter((schedule) => schedule.isContain(now))
    const focusSessionRecords = await this.focusSessionRecordsStorageService.get()

    for (const schedule of schedules) {
      if (!isScheduleCompleteTarget(schedule, focusSessionRecords, getWeekdayFromDate(now))) {
        return true
      }
    }

    return false
  }

  private isInBreak(): boolean {
    const timerInfo = this.timerInfoGetter.getTimerInfo()
    if (timerInfo.timerStage === TimerStage.FOCUS) {
      return false
    }
    if (timerInfo.isRunning) {
      return true
    }

    // If user hasn't pressed the start of the timer even the stage is break, still is not in break yet.
    if (
      timerInfo.timerStage === TimerStage.SHORT_BREAK &&
      timerInfo.shortBreak.totalMilliseconds <= timerInfo.remaining.totalMilliseconds
    ) {
      return false
    }
    if (
      timerInfo.timerStage === TimerStage.LONG_BREAK &&
      timerInfo.longBreak.totalMilliseconds <= timerInfo.remaining.totalMilliseconds
    ) {
      return false
    }
    return true
  }

  private isRunning(): boolean {
    const timerInfo = this.timerInfoGetter.getTimerInfo()
    return timerInfo.isRunning
  }
}
