import type { WeeklySchedule } from '../../../shared/src/domain/schedules'
import { WeeklySchedulesStorageService } from '../../../shared/src/domain/schedules/storage'
import { FakeBrowsingControlService, type BrowsingControlService } from '../infra/browsing_control'
import {
  fakeBrowsingRulesStorageService,
  fakeFocusSessionRecordsStorageService,
  fakeTimerBasedBlockingRulesStorageService,
  fakeWeeklySchedulesStorageService
} from '../infra/storage/factories/fake'
import { isSameDay } from '../utils/date'
import { BrowsingRulesStorageService } from './browsing_rules/storage'
import { Duration } from './timer/duration'
import { FocusSessionRecordsStorageService } from './timer/record/storage'
import { TimerStage } from './timer/stage'
import { TimerBasedBlockingRulesStorageService } from './timer_based_blocking/storage'

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
    browsingRulesStorageService = fakeBrowsingRulesStorageService(),
    weeklySchedulesStorageService = fakeWeeklySchedulesStorageService(),
    timerBasedBlockingRulesStorageService = fakeTimerBasedBlockingRulesStorageService(),
    focusSessionRecordsStorageService = fakeFocusSessionRecordsStorageService(),
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
    this.timerBasedBlockingRulesStorageService = timerBasedBlockingRulesStorageService
    this.focusSessionRecordsStorageService = focusSessionRecordsStorageService
    this.timerInfoGetter = timerInfoGetter
  }

  async run(): Promise<void> {
    if (await this.shouldActivateBrowsingRules()) {
      const browsingRules = await this.browsingRulesStorageService.get()
      return this.browsingControlService.setAndActivateNewRules(browsingRules)
    }
    return this.browsingControlService.deactivateExistingRules()
  }

  private async shouldActivateBrowsingRules(): Promise<boolean> {
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
      if (!schedule.targetFocusSessions) {
        return true
      }
      const completedSessions = focusSessionRecords.filter(
        (record) => isSameDay(record.completedAt, now) && schedule.isContain(record.completedAt)
      )
      if (completedSessions.length < schedule.targetFocusSessions) {
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
