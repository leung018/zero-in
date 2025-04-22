import { describe, expect, it } from 'vitest'
import { BrowsingRules } from './browsing_rules'
import { BrowsingRulesStorageService } from './browsing_rules/storage'
import { FakeBrowsingControlService } from './browsing_control'
import { Weekday, WeeklySchedule } from './schedules'
import { Time } from './time'
import { WeeklyScheduleStorageService } from './schedules/storage'
import { BrowsingControlTogglingService } from './browsing_control_toggling'
import { CurrentDateService } from '../infra/current_date'
import { PomodoroStage } from './pomodoro/stage'

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
        currentDate: new Date('2025-02-03T11:00:00'),
        shouldPauseBlockingDuringBreaks: false
      })
    ).toEqual(browsingRules)
    expect(
      await getBrowsingRulesAfterToggling({
        browsingRules,
        schedules,
        currentDate: new Date('2025-02-03T17:01:00'),
        shouldPauseBlockingDuringBreaks: false
      })
    ).toBeNull()
  })

  it('should always activate when weekly schedules are empty', async () => {
    const browsingRules = new BrowsingRules({ blockedDomains: ['example.com', 'facebook.com'] })
    expect(
      await getBrowsingRulesAfterToggling({
        browsingRules,
        schedules: [],
        currentDate: new Date(),
        shouldPauseBlockingDuringBreaks: false
      })
    ).toEqual(browsingRules)
  })

  it('should not activate browsing rules when timer is in break and shouldPauseBlockingDuringBreaks is enabled', async () => {
    const browsingRules = new BrowsingRules({ blockedDomains: ['example.com', 'facebook.com'] })
    expect(
      await getBrowsingRulesAfterToggling({
        browsingRules,
        schedules: [],
        shouldPauseBlockingDuringBreaks: true,
        timerStage: PomodoroStage.SHORT_BREAK
      })
    ).toBeNull()
    expect(
      await getBrowsingRulesAfterToggling({
        browsingRules,
        schedules: [],
        shouldPauseBlockingDuringBreaks: true,
        timerStage: PomodoroStage.LONG_BREAK
      })
    ).toBeNull()

    // Otherwise, the browsing rules should be activated
    expect(
      await getBrowsingRulesAfterToggling({
        browsingRules,
        schedules: [],
        shouldPauseBlockingDuringBreaks: true,
        timerStage: PomodoroStage.FOCUS
      })
    ).toEqual(browsingRules)

    expect(
      await getBrowsingRulesAfterToggling({
        browsingRules,
        schedules: [],
        shouldPauseBlockingDuringBreaks: false,
        timerStage: PomodoroStage.SHORT_BREAK
      })
    ).toEqual(browsingRules)
  })
})

async function getBrowsingRulesAfterToggling({
  browsingRules = new BrowsingRules(),
  schedules = [
    new WeeklySchedule({
      weekdaySet: new Set([Weekday.MON]),
      startTime: new Time(0, 0),
      endTime: new Time(23, 59)
    })
  ],
  currentDate = new Date(),
  shouldPauseBlockingDuringBreaks = false,
  timerStage = PomodoroStage.FOCUS
} = {}) {
  if (shouldPauseBlockingDuringBreaks && timerStage !== PomodoroStage.FOCUS) {
    return null
  }

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
