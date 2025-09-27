import { SubscriptionManager } from './subscription'

export class FakeClock {
  private elapsedTime: number = 0
  private subscriptionManager = new SubscriptionManager<number>()
  private lastBroadcastTime: number = -1
  private minTickMs: number

  constructor(minTickMs = 100) {
    this.minTickMs = minTickMs
  }

  subscribeTimeChange(listener: (elapsedTime: number) => void) {
    return this.subscriptionManager.subscribe(listener)
  }

  unsubscribeTimeChange(subscriptionId: number) {
    this.subscriptionManager.unsubscribe(subscriptionId)
  }

  advanceTime(ms: number) {
    if (this.lastBroadcastTime < 0) {
      this.changeTime(0)
    }

    const newElapsedTime = this.elapsedTime + ms

    while (newElapsedTime - this.lastBroadcastTime >= this.minTickMs) {
      this.changeTime(this.lastBroadcastTime + this.minTickMs)
    }

    this.elapsedTime = newElapsedTime
  }

  private changeTime(time: number) {
    this.elapsedTime = time
    this.lastBroadcastTime = time
    this.subscriptionManager.broadcast(time)
  }

  getElapsedTime(): number {
    return this.elapsedTime
  }
}
