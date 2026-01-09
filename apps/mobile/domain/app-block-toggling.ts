import { WeeklySchedulesStorageService } from '../../../packages/shared/src/domain/schedules/storage'
import { AppBlocker, FakeAppBlocker } from '../infra/app-blocker'
import { findActiveOrNextScheduleSpan } from './schedules/schedule-span'

export class AppBlockTogglingService {
  private weeklySchedulesStorageService: WeeklySchedulesStorageService
  private appBlocker: AppBlocker

  static createFake({
    weeklySchedulesStorageService,
    appBlocker
  }: {
    weeklySchedulesStorageService: WeeklySchedulesStorageService
    appBlocker: FakeAppBlocker
  }): AppBlockTogglingService {
    return new AppBlockTogglingService({
      weeklySchedulesStorageService,
      appBlocker
    })
  }

  private constructor({
    weeklySchedulesStorageService,
    appBlocker
  }: {
    weeklySchedulesStorageService: WeeklySchedulesStorageService
    appBlocker: AppBlocker
  }) {
    this.weeklySchedulesStorageService = weeklySchedulesStorageService
    this.appBlocker = appBlocker
  }

  async run(currentDate: Date = new Date()) {
    const scheduleSpan = findActiveOrNextScheduleSpan(
      await this.weeklySchedulesStorageService.get(), // TODO: Exclude schedules that completed target focus sessions
      currentDate
    )
    if (scheduleSpan) {
      return Promise.all([this.appBlocker.unblockApps(), this.appBlocker.setSchedule(scheduleSpan)])
    }

    return Promise.all([this.appBlocker.clearSchedule(), this.appBlocker.blockApps()])
  }
}
