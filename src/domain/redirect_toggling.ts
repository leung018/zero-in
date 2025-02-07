import { FakeWebsiteRedirectService, type WebsiteRedirectService } from './redirect'
import {
  BrowsingRulesStorageServiceImpl,
  type BrowsingRulesStorageService
} from './browsing_rules/storage'
import type { WeeklySchedule } from './schedules'
import {
  WeeklyScheduleStorageServiceImpl,
  type WeeklyScheduleStorageService
} from './schedules/storage'
import { ChromeRedirectService } from '../chrome/redirect'
import config from '../config'

export class RedirectTogglingService {
  readonly websiteRedirectService: WebsiteRedirectService
  readonly browsingRulesStorageService: BrowsingRulesStorageService
  readonly weeklyScheduleStorageService: WeeklyScheduleStorageService
  private readonly targetRedirectUrl: string

  static create() {
    return new RedirectTogglingService({
      websiteRedirectService: new ChromeRedirectService(),
      browsingRulesStorageService: BrowsingRulesStorageServiceImpl.create(),
      weeklyScheduleStorageService: WeeklyScheduleStorageServiceImpl.create(),
      targetRedirectUrl: config.getBlockedTemplateUrl()
    })
  }

  static createFake({
    websiteRedirectService = new FakeWebsiteRedirectService(),
    browsingRulesStorageService = BrowsingRulesStorageServiceImpl.createFake(),
    weeklyScheduleStorageService = WeeklyScheduleStorageServiceImpl.createFake(),
    targetRedirectUrl = 'https://example.com'
  }: {
    websiteRedirectService?: WebsiteRedirectService
    browsingRulesStorageService?: BrowsingRulesStorageService
    weeklyScheduleStorageService?: WeeklyScheduleStorageService
    targetRedirectUrl?: string
  } = {}) {
    return new RedirectTogglingService({
      websiteRedirectService,
      browsingRulesStorageService,
      weeklyScheduleStorageService,
      targetRedirectUrl
    })
  }

  private constructor({
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
        return this.websiteRedirectService.activateRedirect(browsingRules, this.targetRedirectUrl)
      })
    }

    return this.websiteRedirectService.deactivateRedirect()
  }
}

function isDateWithinSchedules(date: Date, schedules: ReadonlyArray<WeeklySchedule>) {
  if (schedules.length === 0) {
    return true
  }
  return schedules.some((schedule) => schedule.isContain(date))
}
