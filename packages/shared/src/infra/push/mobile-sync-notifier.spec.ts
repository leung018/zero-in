import { describe, expect, it } from 'vitest'
import { FakeObservableStorage } from '../storage/fake'
import { FakeExpoPushClient } from './expo-push-client'
import { MobileSyncNotifier } from './mobile-sync-notifier'

async function storageWithTokens(tokens: string[]): Promise<FakeObservableStorage> {
  const storage = FakeObservableStorage.create()
  await Promise.all(tokens.map((t) => storage.set(t, { token: t })))
  return storage
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
        getTokenStorage: async () => await storageWithTokens([]),
        pushClient
      })

      await notifier.notify()

      expect(pushClient.sentTokensCalls).toEqual([])
    })

    it('sends all tokens to the push client', async () => {
      const pushClient = new FakeExpoPushClient()
      const storage = await storageWithTokens(['t1', 't2'])
      const notifier = MobileSyncNotifier.createFake({
        getTokenStorage: async () => storage,
        pushClient
      })

      await notifier.notify()

      expect(pushClient.sentTokensCalls).toEqual([['t1', 't2']])
      expect(await storage.getKeys()).toEqual(['t1', 't2'])
    })

    it('unregisters tokens reported as DeviceNotRegistered', async () => {
      const pushClient = new FakeExpoPushClient()
      pushClient.deviceNotRegisteredTokens = ['t2', 't3']
      const storage = await storageWithTokens(['t1', 't2', 't3'])
      const notifier = MobileSyncNotifier.createFake({
        getTokenStorage: async () => storage,
        pushClient
      })

      await notifier.notify()

      expect(await storage.getKeys()).toEqual(['t1'])
    })

    it('rejects when the push client throws', async () => {
      const pushClient = new FakeExpoPushClient()
      pushClient.sendError = new Error('network down')
      const notifier = MobileSyncNotifier.createFake({
        getTokenStorage: async () => await storageWithTokens(['t1']),
        pushClient
      })

      await expect(notifier.notify()).rejects.toThrow('network down')
    })
  })

  describe('register', () => {
    it('stores token in storage', async () => {
      const storage = FakeObservableStorage.create()
      const notifier = MobileSyncNotifier.createFake({ getTokenStorage: async () => storage })

      await notifier.register('token1', 'ios')

      expect(await storage.getKeys()).toContain('token1')
    })

    it('no-ops when no token storage', async () => {
      const notifier = MobileSyncNotifier.createFake({ getTokenStorage: async () => null })

      await expect(notifier.register('token1', 'ios')).resolves.toBeUndefined()
    })
  })

  describe('unregister', () => {
    it('removes token from storage', async () => {
      const storage = await storageWithTokens(['token1'])
      const notifier = MobileSyncNotifier.createFake({ getTokenStorage: async () => storage })

      await notifier.unregister('token1')

      expect(await storage.getKeys()).not.toContain('token1')
    })

    it('no-ops when no token storage', async () => {
      const notifier = MobileSyncNotifier.createFake({ getTokenStorage: async () => null })

      await expect(notifier.unregister('token1')).resolves.toBeUndefined()
    })
  })
})
