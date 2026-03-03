import { ScheduleSpan } from '../../domain/schedules/schedule-span'

export interface AppBlocker {
  setBlockingSchedule(scheduleSpan: ScheduleSpan): Promise<void>
  clearBlockingSchedule(): Promise<void>
  enableAlwaysBlock(): Promise<void>
  disableAlwaysBlock(): Promise<void>
}

export class FakeAppBlocker implements AppBlocker {
  private activeScheduleSpan: ScheduleSpan | null = null
  private _isAlwaysBlockActivated: boolean = false

  async setBlockingSchedule(scheduleSpan: ScheduleSpan): Promise<void> {
    this.activeScheduleSpan = scheduleSpan
  }

  async clearBlockingSchedule(): Promise<void> {
    this.activeScheduleSpan = null
  }

  getBlockingScheduleSpan(): ScheduleSpan | null {
    return this.activeScheduleSpan
  }

  async enableAlwaysBlock() {
    this._isAlwaysBlockActivated = true
  }

  async disableAlwaysBlock() {
    this._isAlwaysBlockActivated = false
  }

  isAlwaysBlockActivated(): boolean {
    return this._isAlwaysBlockActivated
  }
}
