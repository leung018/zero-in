import type { WebsiteRedirectService } from './redirect'
import type { BrowsingRulesStorageService } from './browsing_rules/storage'
import type { WeeklySchedule } from './schedules'
import type { WeeklyScheduleStorageService } from './schedules/storage'

export class RedirectTogglingService {
  private websiteRedirectService: WebsiteRedirectService
  private browsingRulesStorageService: BrowsingRulesStorageService
  private weeklyScheduleStorageService: WeeklyScheduleStorageService
  private readonly targetRedirectUrl: string

  constructor({
    websiteRedirectService,
    browsingRulesStorageService,
    weeklyScheduleStorageService,
    targetRedirectUrl
  }: {
    websiteRedirectService: WebsiteRedirectService
    browsingRulesStorageService: BrowsingRulesStorageService
    weeklyScheduleStorageService: WeeklyScheduleStorageService
    targetRedirectUrl: string
  }) {
    this.websiteRedirectService = websiteRedirectService
    this.browsingRulesStorageService = browsingRulesStorageService
    this.weeklyScheduleStorageService = weeklyScheduleStorageService
    this.targetRedirectUrl = targetRedirectUrl
  }

  async run(currentTime: Date = new Date()): Promise<void> {
    const schedules = await this.weeklyScheduleStorageService.getAll()

    if (isDateWithinSchedules(currentTime, schedules)) {
      return this.browsingRulesStorageService.get().then((browsingRules) => {
        this.websiteRedirectService.activateRedirect(browsingRules, this.targetRedirectUrl)
      })
    }

    return this.websiteRedirectService.deactivateRedirect()
  }
}

function isDateWithinSchedules(date: Date, schedules: ReadonlyArray<WeeklySchedule>) {
  return schedules.some((schedule) => schedule.isContain(date))
}
