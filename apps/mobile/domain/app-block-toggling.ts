import { WeeklySchedulesStorageService } from '../../../packages/shared/src/domain/schedules/storage'
import { FocusSessionRecordsStorageService } from '../../../packages/shared/src/domain/timer/record/storage'
import { AppBlocker, FakeAppBlocker } from '../infra/app-block/interface'
import { findActiveOrNextScheduleSpan } from './schedules/schedule-span'

export class AppBlockTogglingService {
  private weeklySchedulesStorageService: WeeklySchedulesStorageService
  private focusSessionRecordsStorageService: FocusSessionRecordsStorageService
  private appBlocker: AppBlocker

  static createFake({
    weeklySchedulesStorageService,
    focusSessionRecordsStorageService,
    appBlocker
  }: {
    weeklySchedulesStorageService: WeeklySchedulesStorageService
    focusSessionRecordsStorageService: FocusSessionRecordsStorageService
    appBlocker: FakeAppBlocker
  }): AppBlockTogglingService {
    return new AppBlockTogglingService({
      weeklySchedulesStorageService,
      focusSessionRecordsStorageService,
      appBlocker
    })
  }

  constructor({
    weeklySchedulesStorageService,
    focusSessionRecordsStorageService,
    appBlocker
  }: {
    weeklySchedulesStorageService: WeeklySchedulesStorageService
    focusSessionRecordsStorageService: FocusSessionRecordsStorageService
    appBlocker: AppBlocker
  }) {
    this.weeklySchedulesStorageService = weeklySchedulesStorageService
    this.focusSessionRecordsStorageService = focusSessionRecordsStorageService
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
