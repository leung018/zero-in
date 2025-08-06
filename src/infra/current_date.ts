export class CurrentDateService {
  static create() {
    return new CurrentDateService(() => new Date())
  }

  getDate: () => Date

  private constructor(getDate: () => Date) {
    this.getDate = getDate
  }
}
