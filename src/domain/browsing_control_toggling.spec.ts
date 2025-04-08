import { describe, expect, it } from 'vitest'
import { BrowsingRules } from './browsing_rules'
import { BrowsingRulesStorageService } from './browsing_rules/storage'
import { FakeBrowsingControlService } from './browsing_control'
import { Weekday, WeeklySchedule } from './schedules'
import { Time } from './time'
import { WeeklyScheduleStorageService } from './schedules/storage'
import { BrowsingControlTogglingService } from './browsing_control_toggling'
import { CurrentDateService } from '../infra/current_date'

describe('BrowsingControlTogglingService', () => {
  it('should toggle according to browsing rules if current time is within schedule', async () => {
    const browsingRules = new BrowsingRules({ blockedDomains: ['example.com', 'facebook.com'] })
    const schedules = [
      new WeeklySchedule({
        weekdaySet: new Set([Weekday.MON, Weekday.TUE]),
        startTime: new Time(9, 0),
        endTime: new Time(17, 0)
      })
    ]

    expect(
      await getBrowsingRulesAfterToggling({
        browsingRules,
        schedules,
        currentDate: new Date('2025-02-03T11:00:00')
      })
    ).toEqual(browsingRules)
    expect(
      await getBrowsingRulesAfterToggling({
        browsingRules,
        schedules,
        currentDate: new Date('2025-02-03T17:01:00')
      })
    ).toBeNull()
  })

  it('should always activate when weekly schedules are empty', async () => {
    const browsingRules = new BrowsingRules({ blockedDomains: ['example.com', 'facebook.com'] })
    expect(
      await getBrowsingRulesAfterToggling({
        browsingRules,
        schedules: [],
        currentDate: new Date()
      })
    ).toEqual(browsingRules)
  })
})

async function getBrowsingRulesAfterToggling({
  browsingRules,
  schedules,
  currentDate
}: {
  browsingRules: BrowsingRules
  schedules: WeeklySchedule[]
  currentDate: Date
}) {
  const browsingRulesStorageService = BrowsingRulesStorageService.createFake()
  browsingRulesStorageService.save(browsingRules)

  const weeklyScheduleStorageService = WeeklyScheduleStorageService.createFake()
  weeklyScheduleStorageService.saveAll(schedules)

  const currentDateService = CurrentDateService.createFake(currentDate)

  const browsingControlService = new FakeBrowsingControlService()

  const browsingControlTogglingService = BrowsingControlTogglingService.createFake({
    browsingRulesStorageService,
    browsingControlService,
    weeklyScheduleStorageService,
    currentDateService
  })

  await browsingControlTogglingService.run()

  return browsingControlService.getActivatedBrowsingRules()
}
