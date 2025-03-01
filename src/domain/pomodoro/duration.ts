export class Duration {
  readonly totalMilliseconds: number

  constructor({
    minutes = 0,
    seconds = 0,
    milliseconds = 0
  }: {
    minutes?: number
    seconds?: number
    milliseconds?: number
  }) {
    this.totalMilliseconds = minutes * 60 * 1000 + seconds * 1000 + milliseconds

    if (this.totalMilliseconds < 0) {
      throw new DurationInvalidInputError('Duration cannot be negative')
    }
  }

  remainingSeconds(): number {
    return Math.ceil(this.totalMilliseconds / 1000)
  }

  subtract(duration: Duration): Duration {
    let newTotalMilliseconds = this.totalMilliseconds - duration.totalMilliseconds
    if (newTotalMilliseconds < 0) {
      newTotalMilliseconds = 0
    }
    return new Duration({ milliseconds: newTotalMilliseconds })
  }

  isZero(): boolean {
    return this.totalMilliseconds === 0
  }
}

export class DurationInvalidInputError extends Error {}
