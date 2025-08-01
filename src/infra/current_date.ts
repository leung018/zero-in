import { FakeTimeCounter } from '../utils/fake_time_counter'

export class CurrentDateService {
  static create() {
    return new CurrentDateService(() => new Date())
  }

  static createFake(
    stubbedDate: Date = new Date(),
    fakeTimeCounter: FakeTimeCounter = new FakeTimeCounter()
  ) {
    const getNewDate: () => Date = () => {
      return new Date(stubbedDate.getTime() + fakeTimeCounter.getElapsedSystemTime())
    }
    return new CurrentDateService(getNewDate)
  }

  getDate: () => Date

  private constructor(getDate: () => Date) {
    this.getDate = getDate
  }
}
