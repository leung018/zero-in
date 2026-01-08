import { WeeklySchedulesStorageService } from '../../../packages/shared/src/domain/schedules/storage'
import { findActiveOrNextScheduleSpan, ScheduleSpan } from './schedules/schedule-span'

export class AppBlockTogglingService {
  private weeklySchedulesStorageService: WeeklySchedulesStorageService
  private appBlocker: FakeAppBlocker

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
    appBlocker: FakeAppBlocker
  }) {
    this.weeklySchedulesStorageService = weeklySchedulesStorageService
    this.appBlocker = appBlocker
  }

  async run(currentDate: Date = new Date()) {
    const scheduleSpan = findActiveOrNextScheduleSpan(
      await this.weeklySchedulesStorageService.get(),
      currentDate
    )
    if (scheduleSpan) {
      this.appBlocker.scheduleBlock(scheduleSpan)
    }
  }
}

export class FakeAppBlocker {
  private activeScheduleSpan: ScheduleSpan | null = null

  scheduleBlock(scheduleSpan: ScheduleSpan) {
    this.activeScheduleSpan = scheduleSpan
  }

  getBlockingScheduleSpan(): ScheduleSpan | null {
    return this.activeScheduleSpan
  }
}
