import { SubscriptionManager } from './subscription'

export class FakeClock {
  private elapsedTime: number = 0
  private subscriptionManager = new SubscriptionManager<number>()

  subscribeTimeChange(listener: (elapsedTime: number) => void) {
    return this.subscriptionManager.subscribe(listener)
  }

  unsubscribeTimeChange(subscriptionId: number) {
    this.subscriptionManager.unsubscribe(subscriptionId)
  }

  advanceTime(ms: number) {
    this.elapsedTime += ms
    this.subscriptionManager.broadcast(this.elapsedTime)
  }

  getElapsedTime(): number {
    return this.elapsedTime
  }
}
