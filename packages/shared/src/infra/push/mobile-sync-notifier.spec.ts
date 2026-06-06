import { describe, expect, it } from 'vitest'
import { FakeExpoPushClient } from './expo-push-client'
import { MobileSyncNotifier, TokenStoragePort } from './mobile-sync-notifier'

class FakeTokenStorage implements TokenStoragePort {
  private entries = new Map<string, any>()
  deleteCalls: string[] = []

  static withTokens(tokens: string[]): FakeTokenStorage {
    const s = new FakeTokenStorage()
    tokens.forEach((t) => s.entries.set(t, { token: t }))
    return s
  }

  async set(key: string, value: any): Promise<void> {
    this.entries.set(key, value)
  }

  async delete(key: string): Promise<void> {
    this.deleteCalls.push(key)
    this.entries.delete(key)
  }

  async list(): Promise<{ id: string }[]> {
    return [...this.entries.keys()].map((id) => ({ id }))
  }

  tokens(): string[] {
    return [...this.entries.keys()]
  }
}

describe('MobileSyncNotifier', () => {
  describe('notify', () => {
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
        getTokenStorage: async () => FakeTokenStorage.withTokens([]),
        pushClient
      })

      await notifier.notify()

      expect(pushClient.sentTokensCalls).toEqual([])
    })

    it('sends all tokens to the push client', async () => {
      const pushClient = new FakeExpoPushClient()
      const storage = FakeTokenStorage.withTokens(['t1', 't2'])
      const notifier = MobileSyncNotifier.createFake({
        getTokenStorage: async () => storage,
        pushClient
      })

      await notifier.notify()

      expect(pushClient.sentTokensCalls).toEqual([['t1', 't2']])
      expect(storage.deleteCalls).toEqual([])
    })

    it('unregisters tokens reported as DeviceNotRegistered', async () => {
      const pushClient = new FakeExpoPushClient()
      pushClient.deviceNotRegisteredTokens = ['t2', 't3']
      const storage = FakeTokenStorage.withTokens(['t1', 't2', 't3'])
      const notifier = MobileSyncNotifier.createFake({
        getTokenStorage: async () => storage,
        pushClient
      })

      await notifier.notify()

      expect(storage.deleteCalls.sort()).toEqual(['t2', 't3'])
      expect(storage.tokens()).toEqual(['t1'])
    })

    it('rejects when the push client throws', async () => {
      const pushClient = new FakeExpoPushClient()
      pushClient.sendError = new Error('network down')
      const notifier = MobileSyncNotifier.createFake({
        getTokenStorage: async () => FakeTokenStorage.withTokens(['t1']),
        pushClient
      })

      await expect(notifier.notify()).rejects.toThrow('network down')
    })
  })

  describe('register', () => {
    it('stores token in storage', async () => {
      const storage = new FakeTokenStorage()
      const notifier = MobileSyncNotifier.createFake({ getTokenStorage: async () => storage })

      await notifier.register('token1', 'ios')

      expect(storage.tokens()).toContain('token1')
    })

    it('no-ops when no token storage', async () => {
      const notifier = MobileSyncNotifier.createFake({ getTokenStorage: async () => null })

      await expect(notifier.register('token1', 'ios')).resolves.toBeUndefined()
    })
  })

  describe('unregister', () => {
    it('removes token from storage', async () => {
      const storage = FakeTokenStorage.withTokens(['token1'])
      const notifier = MobileSyncNotifier.createFake({ getTokenStorage: async () => storage })

      await notifier.unregister('token1')

      expect(storage.tokens()).not.toContain('token1')
    })

    it('no-ops when no token storage', async () => {
      const notifier = MobileSyncNotifier.createFake({ getTokenStorage: async () => null })

      await expect(notifier.unregister('token1')).resolves.toBeUndefined()
    })
  })
})
