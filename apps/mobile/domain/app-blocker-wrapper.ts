import { ScheduleSpan } from '@zero-in/shared/domain/schedules'
import { AppBlocker, BlockingState, FakeAppBlocker } from '../infra/app-block/interface'

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
