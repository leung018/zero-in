import { FakeClock } from '../utils/clock'

export class CurrentDateService {
  static create() {
    return new CurrentDateService(() => new Date())
  }

  static createFake({ stubbedDate = new Date(), fakeClock = new FakeClock() } = {}) {
    const getNewDate: () => Date = () => {
      return new Date(stubbedDate.getTime() + fakeClock.getElapsedTime())
    }
    return new CurrentDateService(getNewDate)
  }

  getDate: () => Date

  private constructor(getDate: () => Date) {
    this.getDate = getDate
  }
}
