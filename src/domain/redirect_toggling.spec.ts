import { describe, expect, it } from 'vitest'
import { BrowsingRules } from './browsing_rules'
import { BrowsingRulesStorageService } from './browsing_rules/storage'
import { FakeWebsiteRedirectService } from './redirect'
import { Weekday, WeeklySchedule } from './schedules'
import { Time } from './schedules/time'
import { WeeklyScheduleStorageService } from './schedules/storage'
import { RedirectTogglingService } from './redirect_toggling'

describe('RedirectTogglingService', () => {
  it('should toggle redirect according to browsing rules if current time is within schedule', async () => {
    const browsingRules = new BrowsingRules({ blockedDomains: ['example.com', 'facebook.com'] })
    const browsingRulesStorageService = BrowsingRulesStorageService.createFake()
    browsingRulesStorageService.save(browsingRules)

    const schedules = [
      new WeeklySchedule({
        weekdaySet: new Set([Weekday.MON, Weekday.TUE]),
        startTime: new Time(9, 0),
        endTime: new Time(17, 0)
      })
    ]
    const weeklyScheduleStorageService = WeeklyScheduleStorageService.createFake()
    weeklyScheduleStorageService.saveAll(schedules)

    const websiteRedirectService = new FakeWebsiteRedirectService()

    const redirectTogglingService = RedirectTogglingService.createFake({
      browsingRulesStorageService,
      websiteRedirectService,
      weeklyScheduleStorageService
    })

    await redirectTogglingService.run(new Date('2025-02-03T11:00:00')) // 2025-02-03 is Mon

    expect(websiteRedirectService.getActivatedBrowsingRules()).toEqual(browsingRules)

    await redirectTogglingService.run(new Date('2025-02-03T17:01:00'))
    expect(websiteRedirectService.getActivatedBrowsingRules()).toBeNull()
  })

  it('should always activate redirect when weekly schedules are empty', async () => {
    const browsingRules = new BrowsingRules({ blockedDomains: ['example.com', 'facebook.com'] })
    const browsingRulesStorageService = BrowsingRulesStorageService.createFake()
    browsingRulesStorageService.save(browsingRules)

    const weeklyScheduleStorageService = WeeklyScheduleStorageService.createFake()

    const websiteRedirectService = new FakeWebsiteRedirectService()

    const redirectTogglingService = RedirectTogglingService.createFake({
      browsingRulesStorageService,
      websiteRedirectService,
      weeklyScheduleStorageService
    })

    await redirectTogglingService.run()

    expect(websiteRedirectService.getActivatedBrowsingRules()).toEqual(browsingRules)
  })
})
