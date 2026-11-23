import { ScheduleSpan } from '@zero-in/shared/domain/schedules'

export type BlockingState =
  | { kind: 'none' }
  | { kind: 'always' }
  | { kind: 'scheduled'; scheduleSpan: ScheduleSpan }

export class AppBlockerWrapper {
  // Be careful about sequences of calls to the app blocker in this class.
  // Unit testing may not cover issues arising from improper sequences of calls.
  static createFake(): FakeAppBlockerWrapper {
    return new FakeAppBlockerWrapper(new FakeAppBlocker())
  }

  constructor(private appBlocker: AppBlocker) {}

  async setBlockingSchedule(scheduleSpan: ScheduleSpan) {
    await this.appBlocker.disableAlwaysBlock()
    await this.appBlocker.setBlockingSchedule(scheduleSpan)
    return scheduleSpan
  }

  async enableAlwaysBlock() {
    await this.appBlocker.clearBlockingSchedule()
    await this.appBlocker.enableAlwaysBlock()
  }

  async disableAllBlocking() {
    await this.appBlocker.clearBlockingSchedule()
    await this.appBlocker.disableAlwaysBlock()
  }
}
export class FakeAppBlockerWrapper extends AppBlockerWrapper {
  constructor(private fakeAppBlocker: FakeAppBlocker) {
    super(fakeAppBlocker)
  }

  getBlockingState(): BlockingState {
    return this.fakeAppBlocker.getBlockingState()
  }
}

interface AppBlocker {
  setBlockingSchedule(scheduleSpan: ScheduleSpan): Promise<void>
  clearBlockingSchedule(): Promise<void>
  enableAlwaysBlock(): Promise<void>
  disableAlwaysBlock(): Promise<void>
}

class FakeAppBlocker implements AppBlocker {
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
