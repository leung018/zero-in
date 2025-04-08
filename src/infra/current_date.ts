export class CurrentDateService {
  static create() {
    return new CurrentDateService(() => new Date())
  }

  static createFake(stubbedDate: Date = new Date()) {
    return new CurrentDateService(() => stubbedDate)
  }

  getDate: () => Date

  private constructor(getDate: () => Date) {
    this.getDate = getDate
  }
}
