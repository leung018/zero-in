import { FakeBrowsingControlService, type BrowsingControlService } from './browsing_control'
import { BrowsingRulesStorageService } from './browsing_rules/storage'
import type { WeeklySchedule } from './schedules'
import { WeeklyScheduleStorageService } from './schedules/storage'
import { ChromeBrowsingControlService } from '../chrome/browsing_control'
import { CurrentDateService } from '../infra/current_date'

export class BrowsingControlTogglingService {
  private browsingControlService: BrowsingControlService
  private browsingRulesStorageService: BrowsingRulesStorageService
  private weeklyScheduleStorageService: WeeklyScheduleStorageService
  private currentDateService: CurrentDateService

  static create() {
    return new BrowsingControlTogglingService({
      browsingControlService: new ChromeBrowsingControlService(),
      browsingRulesStorageService: BrowsingRulesStorageService.create(),
      weeklyScheduleStorageService: WeeklyScheduleStorageService.create(),
      currentDateService: CurrentDateService.create()
    })
  }

  static createFake({
    browsingControlService = new FakeBrowsingControlService(),
    browsingRulesStorageService = BrowsingRulesStorageService.createFake(),
    weeklyScheduleStorageService = WeeklyScheduleStorageService.createFake(),
    currentDateService = CurrentDateService.createFake()
  } = {}) {
    return new BrowsingControlTogglingService({
      browsingControlService,
      browsingRulesStorageService,
      weeklyScheduleStorageService,
      currentDateService
    })
  }

  constructor({
    browsingControlService,
    browsingRulesStorageService,
    weeklyScheduleStorageService,
    currentDateService
  }: {
    browsingControlService: BrowsingControlService
    browsingRulesStorageService: BrowsingRulesStorageService
    weeklyScheduleStorageService: WeeklyScheduleStorageService
    currentDateService: CurrentDateService
  }) {
    this.browsingControlService = browsingControlService
    this.browsingRulesStorageService = browsingRulesStorageService
    this.weeklyScheduleStorageService = weeklyScheduleStorageService
    this.currentDateService = currentDateService
  }

  async run(): Promise<void> {
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
