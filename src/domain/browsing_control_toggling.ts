import { FakeBrowsingControlService, type BrowsingControlService } from './browsing_control'
import { BrowsingRulesStorageService } from './browsing_rules/storage'
import type { WeeklySchedule } from './schedules'
import { WeeklyScheduleStorageService } from './schedules/storage'
import { ChromeBrowsingControlService } from '../chrome/browsing_control'
import { CurrentDateService } from '../infra/current_date'
import { BlockingTimerIntegrationStorageService } from './blocking_timer_integration/storage'
import { PomodoroStage } from './pomodoro/stage'

interface TimerSubStateGetter {
  getTimerSubState(): {
    stage: PomodoroStage
    isRunning: boolean
  }
}

export class BrowsingControlTogglingService {
  private browsingControlService: BrowsingControlService
  private browsingRulesStorageService: BrowsingRulesStorageService
  private weeklyScheduleStorageService: WeeklyScheduleStorageService
  private blockingTimerIntegrationStorageService: BlockingTimerIntegrationStorageService
  private timerSubStateGetter: TimerSubStateGetter
  private currentDateService: CurrentDateService

  static create() {
    return new BrowsingControlTogglingService({
      browsingControlService: new ChromeBrowsingControlService(),
      browsingRulesStorageService: BrowsingRulesStorageService.create(),
      weeklyScheduleStorageService: WeeklyScheduleStorageService.create(),
      blockingTimerIntegrationStorageService: BlockingTimerIntegrationStorageService.create(),
      timerSubStateGetter: {
        getTimerSubState: () => {
          return {
            stage: PomodoroStage.FOCUS,
            isRunning: false
          }
        }
      }, // TODO: Fix this dependency
      currentDateService: CurrentDateService.create()
    })
  }

  static createFake({
    browsingControlService = new FakeBrowsingControlService(),
    browsingRulesStorageService = BrowsingRulesStorageService.createFake(),
    weeklyScheduleStorageService = WeeklyScheduleStorageService.createFake(),
    blockingTimerIntegrationStorageService = BlockingTimerIntegrationStorageService.createFake(),
    timerSubStateGetter = {
      getTimerSubState: () => ({ stage: PomodoroStage.FOCUS, isRunning: false })
    },
    currentDateService = CurrentDateService.createFake()
  } = {}) {
    return new BrowsingControlTogglingService({
      browsingControlService,
      browsingRulesStorageService,
      weeklyScheduleStorageService,
      blockingTimerIntegrationStorageService,
      timerSubStateGetter,
      currentDateService
    })
  }

  constructor({
    browsingControlService,
    browsingRulesStorageService,
    weeklyScheduleStorageService,
    blockingTimerIntegrationStorageService,
    timerSubStateGetter: timerStageGetter,
    currentDateService
  }: {
    browsingControlService: BrowsingControlService
    browsingRulesStorageService: BrowsingRulesStorageService
    weeklyScheduleStorageService: WeeklyScheduleStorageService
    blockingTimerIntegrationStorageService: BlockingTimerIntegrationStorageService
    timerSubStateGetter: TimerSubStateGetter
    currentDateService: CurrentDateService
  }) {
    this.browsingControlService = browsingControlService
    this.browsingRulesStorageService = browsingRulesStorageService
    this.weeklyScheduleStorageService = weeklyScheduleStorageService
    this.blockingTimerIntegrationStorageService = blockingTimerIntegrationStorageService
    this.timerSubStateGetter = timerStageGetter
    this.currentDateService = currentDateService
  }

  async run(): Promise<void> {
    const blockingTimerIntegration = await this.blockingTimerIntegrationStorageService.get()
    const timerSubState = this.timerSubStateGetter.getTimerSubState()

    if (
      blockingTimerIntegration.shouldPauseBlockingDuringBreaks &&
      timerSubState.stage !== PomodoroStage.FOCUS &&
      timerSubState.isRunning
    ) {
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
}

function isDateWithinSchedules(date: Date, schedules: ReadonlyArray<WeeklySchedule>) {
  if (schedules.length === 0) {
    return true
  }
  return schedules.some((schedule) => schedule.isContain(date))
}
