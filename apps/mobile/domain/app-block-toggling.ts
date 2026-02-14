import { WeeklySchedulesStorageService } from '../../../packages/shared/src/domain/schedules/storage'
import { AppBlocker, FakeAppBlocker } from '../infra/app-block/interface'
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

  constructor({
    weeklySchedulesStorageService,
    appBlocker
  }: {
    weeklySchedulesStorageService: WeeklySchedulesStorageService
    appBlocker: AppBlocker
  }) {
    this.weeklySchedulesStorageService = weeklySchedulesStorageService
    this.appBlocker = appBlocker
  }

  async run() {
    const scheduleSpan = findActiveOrNextScheduleSpan(
      await this.weeklySchedulesStorageService.get() // TODO: Exclude schedules that completed target focus sessions
    )
    if (scheduleSpan) {
      await Promise.all([this.appBlocker.unblockApps(), this.appBlocker.setSchedule(scheduleSpan)])
    } else {
      await Promise.all([this.appBlocker.clearSchedule(), this.appBlocker.blockApps()])
    }

    return scheduleSpan
  }
}
