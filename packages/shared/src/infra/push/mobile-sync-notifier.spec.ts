import { describe, expect, it } from 'vitest'
import { FakeExpoPushClient } from './expo-push-client'
import { MobileSyncNotifier } from './mobile-sync-notifier'

describe('MobileSyncNotifier', () => {
  it('register then unregister then notify does not push', async () => {
    const pushClient = new FakeExpoPushClient()
    const notifier = MobileSyncNotifier.createFake({ pushClient })

    await notifier.register('t1')
    await notifier.unregister('t1')
    await notifier.notify()

    expect(pushClient.sentTokensCalls).toEqual([])
  })

  it('register then notify sends token to push client', async () => {
    const pushClient = new FakeExpoPushClient()
    const notifier = MobileSyncNotifier.createFake({ pushClient })

    await notifier.register('t1')
    await notifier.notify()

    expect(pushClient.sentTokensCalls).toEqual([['t1']])
  })

  it('notify rejects when push client throws', async () => {
    const pushClient = new FakeExpoPushClient()
    pushClient.sendError = new Error('network down')
    const notifier = MobileSyncNotifier.createFake({ pushClient })

    await notifier.register('t1')

    await expect(notifier.notify()).rejects.toThrow('network down')
  })

  it('notify auto-unregisters DeviceNotRegistered tokens so they are skipped on next notify', async () => {
    const pushClient = new FakeExpoPushClient()
    pushClient.deviceNotRegisteredTokens = ['t2']
    const notifier = MobileSyncNotifier.createFake({ pushClient })

    await notifier.register('t1')
    await notifier.register('t2')
    await notifier.notify()
    await notifier.notify()

    expect(pushClient.sentTokensCalls).toEqual([['t1', 't2'], ['t1']])
  })

  it('notify sends all registered tokens', async () => {
    const pushClient = new FakeExpoPushClient()
    const notifier = MobileSyncNotifier.createFake({ pushClient })

    await notifier.register('t1')
    await notifier.register('t2')
    await notifier.notify()

    expect(pushClient.sentTokensCalls).toEqual([['t1', 't2']])
  })
})
