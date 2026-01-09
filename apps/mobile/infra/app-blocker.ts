import { ScheduleSpan } from '../domain/schedules/schedule-span'

export interface AppBlocker {
  setSchedule(scheduleSpan: ScheduleSpan): Promise<void>
  blockApps(): Promise<void>
  unblockApps(): Promise<void>
}

export class FakeAppBlocker implements AppBlocker {
  private activeScheduleSpan: ScheduleSpan | null = null
  private isAppBlocked: boolean = false

  async setSchedule(scheduleSpan: ScheduleSpan): Promise<void> {
    this.activeScheduleSpan = scheduleSpan
  }

  getBlockingScheduleSpan(): ScheduleSpan | null {
    return this.activeScheduleSpan
  }

  async blockApps() {
    this.isAppBlocked = true
  }

  async unblockApps() {
    this.isAppBlocked = false
  }

  getIsAppBlocked(): boolean {
    return this.isAppBlocked
  }
}
