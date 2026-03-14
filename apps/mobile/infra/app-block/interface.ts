import { ScheduleSpan } from '@zero-in/shared/domain/schedules'

export type BlockingState =
  | { kind: 'none' }
  | { kind: 'always' }
  | { kind: 'scheduled'; scheduleSpan: ScheduleSpan }

export interface AppBlocker {
  setBlockingSchedule(scheduleSpan: ScheduleSpan): Promise<void>
  clearBlockingSchedule(): Promise<void>
  enableAlwaysBlock(): Promise<void>
  disableAlwaysBlock(): Promise<void>
}

export class FakeAppBlocker implements AppBlocker {
  private activeScheduleSpan: ScheduleSpan | null = null
  private isAlwaysBlockActivated: boolean = false

  async setBlockingSchedule(scheduleSpan: ScheduleSpan): Promise<void> {
    this.activeScheduleSpan = scheduleSpan
  }

  async clearBlockingSchedule(): Promise<void> {
    this.activeScheduleSpan = null
  }

  async enableAlwaysBlock() {
    this.isAlwaysBlockActivated = true
  }

  async disableAlwaysBlock() {
    this.isAlwaysBlockActivated = false
  }

  getBlockingState(): BlockingState {
    if (this.isAlwaysBlockActivated) {
      return { kind: 'always' }
    }
    if (this.activeScheduleSpan) {
      return { kind: 'scheduled', scheduleSpan: this.activeScheduleSpan }
    }
    return { kind: 'none' }
  }
}
