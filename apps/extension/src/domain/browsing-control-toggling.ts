import { WeeklySchedulesStorageService } from '@zero-in/shared/domain/schedules/storage'
import {
  ShouldActivateBlockingTeller,
  TimerInfoGetter
} from '@zero-in/shared/domain/should-activate-blocking'
import { TimerBasedBlockingRulesStorageService } from '@zero-in/shared/domain/timer-based-blocking/storage'
import { Duration } from '@zero-in/shared/domain/timer/duration'
import { FocusSessionRecordsStorageService } from '@zero-in/shared/domain/timer/record/storage'
import { TimerStage } from '@zero-in/shared/domain/timer/stage'
import { FakeBrowsingControlService, type BrowsingControlService } from '../infra/browsing-control'
import { BrowsingRulesStorageService } from './browsing-rules/storage'

export class BrowsingControlTogglingService {
  private browsingControlService: BrowsingControlService
  private browsingRulesStorageService: BrowsingRulesStorageService
  private shouldActivateBlockingTeller: ShouldActivateBlockingTeller

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
    this.shouldActivateBlockingTeller = new ShouldActivateBlockingTeller({
      weeklySchedulesStorageService,
      focusSessionRecordsStorageService,
      timerBasedBlockingRulesStorageService,
      timerInfoGetter
    })
  }

  async run(): Promise<void> {
    if (await this.shouldActivateBlockingTeller.shouldActivateBlocking()) {
      const browsingRules = await this.browsingRulesStorageService.get()
      return this.browsingControlService.setAndActivateNewRules(browsingRules)
    }
    return this.browsingControlService.deactivateExistingRules()
  }
}
