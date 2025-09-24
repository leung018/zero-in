export class SubscriptionManager<Arguments> {
  private callbackMap = new Map<number, (args: Arguments) => void>()

  subscribe(callback: (args: Arguments) => void) {
    const subscriptionId = this.getSubscriptionCount() + 1
    this.callbackMap.set(subscriptionId, callback)
    return subscriptionId
  }

  unsubscribe(subscriptionId: number) {
    this.callbackMap.delete(subscriptionId)
  }

  broadcast(args: Arguments) {
    this.callbackMap.forEach((callback) => {
      callback(args)
    })
  }

  publish(args: Arguments, subscriptionId: number) {
    const callback = this.callbackMap.get(subscriptionId)
    if (callback) {
      callback(args)
    }
  }

  getSubscriptionCount() {
    return this.callbackMap.size
  }
}
