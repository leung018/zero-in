import { FakeBrowsingControlService, type BrowsingControlService } from './browsing_control'
import { BrowsingRulesStorageService } from './browsing_rules/storage'
import type { WeeklySchedule } from './schedules'
import { WeeklyScheduleStorageService } from './schedules/storage'
import { CurrentDateService } from '../infra/current_date'
import { BlockingTimerIntegrationStorageService } from './blocking_timer_integration/storage'
import { PomodoroStage } from './pomodoro/stage'
interface TimerInfoGetter {
  getTimerInfo(): {
    timerStage: PomodoroStage
    isRunning: boolean
    remainingSeconds: number
    longBreakSeconds: number
    shortBreakSeconds: number
  }
}

export class BrowsingControlTogglingService {
  private browsingControlService: BrowsingControlService
  private browsingRulesStorageService: BrowsingRulesStorageService
  private weeklyScheduleStorageService: WeeklyScheduleStorageService
  private blockingTimerIntegrationStorageService: BlockingTimerIntegrationStorageService
  private timerInfoGetter: TimerInfoGetter
  private currentDateService: CurrentDateService

  static createFake({
    browsingControlService = new FakeBrowsingControlService(),
    browsingRulesStorageService = BrowsingRulesStorageService.createFake(),
    weeklyScheduleStorageService = WeeklyScheduleStorageService.createFake(),
    blockingTimerIntegrationStorageService = BlockingTimerIntegrationStorageService.createFake(),
    timerInfoGetter = {
      getTimerInfo: () => ({
        timerStage: PomodoroStage.FOCUS,
        isRunning: false,
        remainingSeconds: 0,
        longBreakSeconds: 0,
        shortBreakSeconds: 0
      })
    },
    currentDateService = CurrentDateService.createFake()
  } = {}) {
    return new BrowsingControlTogglingService({
      browsingControlService,
      browsingRulesStorageService,
      weeklyScheduleStorageService,
      blockingTimerIntegrationStorageService,
      timerInfoGetter,
      currentDateService
    })
  }

  constructor({
    browsingControlService,
    browsingRulesStorageService,
    weeklyScheduleStorageService,
    blockingTimerIntegrationStorageService,
    timerInfoGetter = {
      getTimerInfo: () => ({
        timerStage: PomodoroStage.FOCUS,
        isRunning: false,
        remainingSeconds: 0,
        longBreakSeconds: 0,
        shortBreakSeconds: 0
      })
    },
    currentDateService
  }: {
    browsingControlService: BrowsingControlService
    browsingRulesStorageService: BrowsingRulesStorageService
    weeklyScheduleStorageService: WeeklyScheduleStorageService
    blockingTimerIntegrationStorageService: BlockingTimerIntegrationStorageService
    timerInfoGetter?: TimerInfoGetter
    currentDateService: CurrentDateService
  }) {
    this.browsingControlService = browsingControlService
    this.browsingRulesStorageService = browsingRulesStorageService
    this.weeklyScheduleStorageService = weeklyScheduleStorageService
    this.blockingTimerIntegrationStorageService = blockingTimerIntegrationStorageService
    this.timerInfoGetter = timerInfoGetter
    this.currentDateService = currentDateService
  }

  async run(): Promise<void> {
    const blockingTimerIntegration = await this.blockingTimerIntegrationStorageService.get()

    if (blockingTimerIntegration.shouldPauseBlockingDuringBreaks && this.isInBreak()) {
      return this.browsingControlService.deactivateExistingRules()
    }

    const schedules = await this.weeklyScheduleStorageService.getAll()

    if (isDateWithinSchedules(this.currentDateService.getDate(), schedules)) {
      return this.browsingRulesStorageService.get().then((browsingRules) => {
        return this.browsingControlService.setAndActivateNewRules(browsingRules)
      })
    }

    return this.browsingControlService.deactivateExistingRules()
  }

  private isInBreak(): boolean {
    const timerInfo = this.timerInfoGetter.getTimerInfo()
    if (timerInfo.timerStage === PomodoroStage.FOCUS) {
      return false
    }
    if (timerInfo.isRunning) {
      return true
    }

    // If user hasn't pressed the start of the timer even the stage is break, still is not in break yet.
    if (
      timerInfo.timerStage === PomodoroStage.SHORT_BREAK &&
      timerInfo.shortBreakSeconds <= timerInfo.remainingSeconds
    ) {
      return false
    }
    if (
      timerInfo.timerStage === PomodoroStage.LONG_BREAK &&
      timerInfo.longBreakSeconds <= timerInfo.remainingSeconds
    ) {
      return false
    }
    return true
  }
}

function isDateWithinSchedules(date: Date, schedules: ReadonlyArray<WeeklySchedule>) {
  if (schedules.length === 0) {
    return true
  }
  return schedules.some((schedule) => schedule.isContain(date))
}
