export class Duration {
  readonly totalSeconds: number

  constructor({ minutes = 0, seconds = 0 }: { minutes?: number; seconds?: number }) {
    this.totalSeconds = minutes * 60 + seconds
    if (this.totalSeconds < 0) {
      throw new DurationInvalidInputError('Duration cannot be negative')
    }
  }

  get minutes(): number {
    return Math.floor(this.totalSeconds / 60)
  }

  get seconds(): number {
    return this.totalSeconds % 60
  }

  subtract(duration: Duration): Duration {
    return new Duration({ seconds: this.totalSeconds - duration.totalSeconds })
  }
}

export class DurationInvalidInputError extends Error {}
