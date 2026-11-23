import { ScheduleSpan } from '@zero-in/shared/domain/schedules'

export type BlockingState =
  | { kind: 'none' }
  | { kind: 'always' }
  | { kind: 'scheduled'; scheduleSpan: ScheduleSpan }

export class AppBlocker {
  // Be careful about sequences of calls to the native app blocker in this class.
  // Unit testing may not cover issues arising from improper sequences of calls.

  static createFake(): FakeAppBlocker {
    return new FakeAppBlocker(new FakeNativeAppBlocker())
  }

  constructor(private nativeAppBlocker: NativeAppBlocker) {}

  async setBlockingSchedule(scheduleSpan: ScheduleSpan) {
    await this.nativeAppBlocker.disableAlwaysBlock()
    await this.nativeAppBlocker.setBlockingSchedule(scheduleSpan)
    return scheduleSpan
  }

  async enableAlwaysBlock() {
    await this.nativeAppBlocker.clearBlockingSchedule()
    await this.nativeAppBlocker.enableAlwaysBlock()
  }

  async disableAllBlocking() {
    await this.nativeAppBlocker.clearBlockingSchedule()
    await this.nativeAppBlocker.disableAlwaysBlock()
  }
}

export class FakeAppBlocker extends AppBlocker {
  constructor(private fakeNativeAppBlocker: FakeNativeAppBlocker) {
    super(fakeNativeAppBlocker)
  }

  getBlockingState(): BlockingState {
    return this.fakeNativeAppBlocker.getBlockingState()
  }
}

interface NativeAppBlocker {
  setBlockingSchedule(scheduleSpan: ScheduleSpan): Promise<void>
  clearBlockingSchedule(): Promise<void>
  enableAlwaysBlock(): Promise<void>
  disableAlwaysBlock(): Promise<void>
}

class FakeNativeAppBlocker implements NativeAppBlocker {
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
