import { isInBreak, TimerInfoGetter } from '@zero-in/shared/domain/blocking-toggling'
import { isScheduleInstanceCompleteTarget } from '@zero-in/shared/domain/is-schedule-complete-target'
import { ScheduleInstance, WeeklySchedule } from '@zero-in/shared/domain/schedules/index'
import { WeeklySchedulesStorageService } from '@zero-in/shared/domain/schedules/storage'
import { TimerBasedBlockingRulesStorageService } from '@zero-in/shared/domain/timer-based-blocking/storage'
import { Duration } from '@zero-in/shared/domain/timer/duration'
import { FocusSessionRecordsStorageService } from '@zero-in/shared/domain/timer/record/storage'
import { TimerStage } from '@zero-in/shared/domain/timer/stage'
import { FakeBrowsingControlService, type BrowsingControlService } from '../infra/browsing-control'
import { BrowsingRulesStorageService } from './browsing-rules/storage'

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

    if (
      timerBasedBlockingRules.pauseBlockingDuringBreaks &&
      isInBreak(this.timerInfoGetter.getTimerInfo())
    ) {
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
    const currentInstances: ScheduleInstance[] = []

    for (const schedule of inputSchedules) {
      const instance = schedule.getInstanceForDate(now)
      if (instance) {
        currentInstances.push(instance)
      }
    }

    const focusSessionRecords = await this.focusSessionRecordsStorageService.get()

    for (const instance of currentInstances) {
      if (!isScheduleInstanceCompleteTarget(instance, focusSessionRecords)) {
        return true
      }
    }

    return false
  }

  private isRunning(): boolean {
    const timerInfo = this.timerInfoGetter.getTimerInfo()
    return timerInfo.isRunning
  }
}
