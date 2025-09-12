import { FakeBrowsingControlService, type BrowsingControlService } from '../infra/browsing_control'
import { isSameDay } from '../utils/date'
import { BlockingTimerIntegrationStorageService } from './blocking_timer_integration/storage'
import { BrowsingRulesStorageService } from './browsing_rules/storage'
import type { WeeklySchedule } from './schedules'
import { WeeklySchedulesStorageService } from './schedules/storage'
import { Duration } from './timer/duration'
import { FocusSessionRecordStorageService } from './timer/record/storage'
import { TimerStage } from './timer/stage'

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
  private focusSessionRecordStorageService: FocusSessionRecordStorageService
  private blockingTimerIntegrationStorageService: BlockingTimerIntegrationStorageService
  private timerInfoGetter: TimerInfoGetter

  static createFake({
    browsingControlService = new FakeBrowsingControlService(),
    browsingRulesStorageService = BrowsingRulesStorageService.createFake(),
    weeklySchedulesStorageService = WeeklySchedulesStorageService.createFake(),
    blockingTimerIntegrationStorageService = BlockingTimerIntegrationStorageService.createFake(),
    focusSessionRecordStorageService = FocusSessionRecordStorageService.createFake(),
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
      blockingTimerIntegrationStorageService,
      focusSessionRecordStorageService,
      timerInfoGetter
    })
  }

  constructor({
    browsingControlService,
    browsingRulesStorageService,
    focusSessionRecordStorageService,
    weeklySchedulesStorageService,
    blockingTimerIntegrationStorageService,
    timerInfoGetter
  }: {
    browsingControlService: BrowsingControlService
    browsingRulesStorageService: BrowsingRulesStorageService
    focusSessionRecordStorageService: FocusSessionRecordStorageService
    weeklySchedulesStorageService: WeeklySchedulesStorageService
    blockingTimerIntegrationStorageService: BlockingTimerIntegrationStorageService
    timerInfoGetter: TimerInfoGetter
  }) {
    this.browsingControlService = browsingControlService
    this.browsingRulesStorageService = browsingRulesStorageService
    this.weeklySchedulesStorageService = weeklySchedulesStorageService
    this.blockingTimerIntegrationStorageService = blockingTimerIntegrationStorageService
    this.focusSessionRecordStorageService = focusSessionRecordStorageService
    this.timerInfoGetter = timerInfoGetter
  }

  async run(): Promise<void> {
    if (await this.shouldActivateBrowsingRules()) {
      const browsingRules = await this.browsingRulesStorageService.get()
      this.browsingControlService.setAndActivateNewRules(browsingRules)
    } else {
      this.browsingControlService.deactivateExistingRules()
    }
  }

  private async shouldActivateBrowsingRules(): Promise<boolean> {
    const blockingTimerIntegration = await this.blockingTimerIntegrationStorageService.get()

    if (blockingTimerIntegration.pauseBlockingWhenTimerNotRunning && !this.isRunning()) {
      return false
    }

    if (blockingTimerIntegration.pauseBlockingDuringBreaks && this.isInBreak()) {
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

    const focusSessionRecords = await this.focusSessionRecordStorageService.get()

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
