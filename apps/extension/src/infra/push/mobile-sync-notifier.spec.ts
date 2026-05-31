import { PushTokenStorage } from '@zero-in/shared/infra/storage/firebase/firestore/token-storage'
import { describe, expect, it } from 'vitest'
import { FakeExpoPushClient } from './expo-push-client'
import { MobileSyncNotifier } from './mobile-sync-notifier'

class FakePushTokenStorage implements PushTokenStorage {
  private tokens: string[] = []
  unregisterCalls: string[] = []

  static withTokens(tokens: string[]): FakePushTokenStorage {
    const s = new FakePushTokenStorage()
    s.tokens = [...tokens]
    return s
  }

  async register({ token }: { token: string; platform: string }): Promise<void> {
    if (!this.tokens.includes(token)) this.tokens.push(token)
  }

  async unregister(token: string): Promise<void> {
    this.unregisterCalls.push(token)
    this.tokens = this.tokens.filter((t) => t !== token)
  }

  async listTokens(): Promise<string[]> {
    return [...this.tokens]
  }
}

describe('MobileSyncNotifier', () => {
  it('no-ops when no token storage available (e.g. signed out)', async () => {
    const pushClient = new FakeExpoPushClient()
    const notifier = MobileSyncNotifier.createFake({
      getTokenStorage: async () => null,
      pushClient
    })

    await notifier.notify()

    expect(pushClient.sentTokensCalls).toEqual([])
  })

  it('no-ops when there are no tokens to notify', async () => {
    const pushClient = new FakeExpoPushClient()
    const notifier = MobileSyncNotifier.createFake({
      getTokenStorage: async () => FakePushTokenStorage.withTokens([]),
      pushClient
    })

    await notifier.notify()

    expect(pushClient.sentTokensCalls).toEqual([])
  })

  it('sends all tokens to the push client', async () => {
    const pushClient = new FakeExpoPushClient()
    const storage = FakePushTokenStorage.withTokens(['t1', 't2'])
    const notifier = MobileSyncNotifier.createFake({
      getTokenStorage: async () => storage,
      pushClient
    })

    await notifier.notify()

    expect(pushClient.sentTokensCalls).toEqual([['t1', 't2']])
    expect(storage.unregisterCalls).toEqual([])
  })

  it('unregisters tokens reported as DeviceNotRegistered', async () => {
    const pushClient = new FakeExpoPushClient()
    pushClient.deviceNotRegisteredTokens = ['t2', 't3']
    const storage = FakePushTokenStorage.withTokens(['t1', 't2', 't3'])
    const notifier = MobileSyncNotifier.createFake({
      getTokenStorage: async () => storage,
      pushClient
    })

    await notifier.notify()

    expect(storage.unregisterCalls.sort()).toEqual(['t2', 't3'])
    expect(await storage.listTokens()).toEqual(['t1'])
  })

  it('rejects when the push client throws', async () => {
    const pushClient = new FakeExpoPushClient()
    pushClient.sendError = new Error('network down')
    const notifier = MobileSyncNotifier.createFake({
      getTokenStorage: async () => FakePushTokenStorage.withTokens(['t1']),
      pushClient
    })

    await expect(notifier.notify()).rejects.toThrow('network down')
  })
})
