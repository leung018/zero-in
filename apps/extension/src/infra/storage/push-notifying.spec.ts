import { MobileSyncNotifier } from '@zero-in/shared/infra/push/mobile-sync-notifier'
import { FakeRemoteStorage } from '@zero-in/shared/infra/storage/fake'
import { describe, expect, it } from 'vitest'
import { PushNotifyingStorageProvider } from './push-notifying'

class SpyMobileSyncNotifier extends MobileSyncNotifier {
  notifyCount = 0
  rejectError: Error | null = null

  constructor() {
    super({
      getTokenStorage: async () => null,
      pushClient: { send: async () => ({ deviceNotRegisteredTokens: [] }) }
    })
  }

  override async notify(): Promise<void> {
    this.notifyCount++
    if (this.rejectError) throw this.rejectError
  }
}

describe('PushNotifyingStorageProvider', () => {
  // TODO: Think of the way to eliminate the need of duplication of tests

  it('delegates set and get to inner and triggers the notifier', async () => {
    const inner = FakeRemoteStorage.create()
    const notifier = new SpyMobileSyncNotifier()
    const provider = new PushNotifyingStorageProvider(inner, notifier)

    expect(notifier.notifyCount).toBe(0)

    await provider.set('timerState', { isRunning: true })
    expect(await provider.get('timerState')).toEqual({ isRunning: true })

    expect(notifier.notifyCount).toBe(1)
  })

  it('does not reject set when the notifier rejects', async () => {
    const inner = FakeRemoteStorage.create()
    const notifier = new SpyMobileSyncNotifier()
    notifier.rejectError = new Error('network error')
    const provider = new PushNotifyingStorageProvider(inner, notifier)

    await expect(provider.set('timerState', {})).resolves.toBeUndefined()
  })

  it('delegates onChange to inner', async () => {
    const inner = FakeRemoteStorage.create()
    const provider = new PushNotifyingStorageProvider(inner, new SpyMobileSyncNotifier())

    let changeCount = 0
    const unsubscribe = await provider.onChange('timerState', () => {
      changeCount++
    })

    await provider.set('timerState', { isRunning: true })
    expect(changeCount).toBe(1)

    await unsubscribe()
    await provider.set('timerState', { isRunning: false })
    expect(changeCount).toBe(1)
  })
})
