import { Duration } from './duration'

export class Timer {
  private onTick: (remaining: Duration) => void = () => {}
  private remaining: Duration = new Duration({ seconds: 0 })

  start(initial: Duration) {
    this.remaining = initial
  }

  advanceTime(duration: Duration) {
    this.remaining = this.remaining.subtract(duration)
    this.onTick(this.remaining)
  }

  setOnTick(callback: (remaining: Duration) => void) {
    this.onTick = callback
  }
}
