import { ScheduleSpan } from '../domain/schedules/schedule-span'

export interface AppBlocker {
  setSchedule(scheduleSpan: ScheduleSpan): Promise<void>
}

export class FakeAppBlocker implements AppBlocker {
  private activeScheduleSpan: ScheduleSpan | null = null

  async setSchedule(scheduleSpan: ScheduleSpan): Promise<void> {
    this.activeScheduleSpan = scheduleSpan
  }

  getBlockingScheduleSpan(): ScheduleSpan | null {
    return this.activeScheduleSpan
  }
}
