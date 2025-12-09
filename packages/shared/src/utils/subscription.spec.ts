import { describe, expect, it } from 'vitest'
import { SubscriptionManager } from './subscription'

describe('SubscriptionManager', () => {
  it('should able to broadcast to subscribers', () => {
    const manager = new SubscriptionManager<number>()
    let count1 = 0
    let count2 = 0

    const id1 = manager.subscribe((n) => {
      count1 += n
    })
    manager.subscribe((n) => {
      count2 += n
    })

    manager.broadcast(5)

    expect(count1).toBe(5)
    expect(count2).toBe(5)

    manager.unsubscribe(id1)
    manager.broadcast(3)

    expect(count1).toBe(5)
    expect(count2).toBe(8)
  })

  it('should able to publish to specific subscriber', () => {
    const manager = new SubscriptionManager<number>()
    let count1 = 0
    let count2 = 0

    const id1 = manager.subscribe((n) => {
      count1 += n
    })
    const id2 = manager.subscribe((n) => {
      count2 += n
    })

    manager.publish(5, id1)
    manager.publish(3, id2)

    expect(count1).toBe(5)
    expect(count2).toBe(3)
  })

  it('should able to get subscription count', () => {
    const manager = new SubscriptionManager<number>()

    expect(manager.getSubscriptionCount()).toBe(0)

    const id = manager.subscribe(() => {})
    expect(manager.getSubscriptionCount()).toBe(1)

    manager.subscribe(() => {})
    expect(manager.getSubscriptionCount()).toBe(2)

    manager.unsubscribe(id)
    expect(manager.getSubscriptionCount()).toBe(1)
  })
})
