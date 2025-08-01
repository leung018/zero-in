import { SubscriptionManager } from './subscription'

export class FakeClock {
  private elapsedSystemTime: number = 0
  private subscriptionManager = new SubscriptionManager<number>()

  subscribeTimeChange(listener: (elapsedSystemTime: number) => void) {
    return this.subscriptionManager.subscribe(listener)
  }

  unsubscribeTimeChange(subscriptionId: number) {
    this.subscriptionManager.unsubscribe(subscriptionId)
  }

  advanceTime(ms: number) {
    this.elapsedSystemTime += ms
    this.subscriptionManager.broadcast(this.elapsedSystemTime)
  }

  getElapsedSystemTime(): number {
    return this.elapsedSystemTime
  }
}
