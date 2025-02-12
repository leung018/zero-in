export class Duration {
  readonly totalSeconds: number

  constructor({ minutes = 0, seconds = 0 }: { minutes?: number; seconds?: number }) {
    this.totalSeconds = minutes * 60 + seconds
  }

  get minutes(): number {
    return Math.floor(this.totalSeconds / 60)
  }

  get seconds(): number {
    return this.totalSeconds % 60
  }
}
