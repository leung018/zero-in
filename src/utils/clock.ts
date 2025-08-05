import { SubscriptionManager } from './subscription'

export class FakeClock {
  private elapsedTime: number = 0
  private subscriptionManager = new SubscriptionManager<number>()
  private smallestIntervalMs = Infinity
  private lastBroadcastTime: number = -1

  subscribeTimeChange(listener: (elapsedTime: number) => void, intervalMs = 1000) {
    this.smallestIntervalMs = Math.min(this.smallestIntervalMs, intervalMs)
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

    while (newElapsedTime - this.lastBroadcastTime >= this.smallestIntervalMs) {
      this.changeTime(this.lastBroadcastTime + this.smallestIntervalMs)
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
