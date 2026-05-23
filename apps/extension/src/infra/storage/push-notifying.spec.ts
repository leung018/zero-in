import { describe, expect, it, vi } from 'vitest'
import { PushNotifyingStorageProvider } from './push-notifying'

vi.mock('@/infra/push/expo-push', () => ({
  notifyMobileSync: vi.fn().mockResolvedValue(undefined)
}))

import { notifyMobileSync } from '@/infra/push/expo-push'

class FakeStorage {
  private data: Record<string, any> = {}

  async get(key: string) {
    return this.data[key] ?? null
  }

  async set(key: string, value: any) {
    this.data[key] = value
  }

  async onChange(_key: string, _cb: (data: any) => void) {
    return () => {}
  }
}

describe('PushNotifyingStorageProvider', () => {
  it('delegates set to inner and notifies mobile sync', async () => {
    const inner = new FakeStorage()
    const provider = new PushNotifyingStorageProvider(inner)

    await provider.set('timerState', { isRunning: true })

    expect(await inner.get('timerState')).toEqual({ isRunning: true })
    expect(notifyMobileSync).toHaveBeenCalled()
  })

  it('does not reject set when notifyMobileSync fails', async () => {
    vi.mocked(notifyMobileSync).mockRejectedValueOnce(new Error('network error'))
    const inner = new FakeStorage()
    const provider = new PushNotifyingStorageProvider(inner)

    await expect(provider.set('timerState', {})).resolves.toBeUndefined()
  })

  it('delegates get to inner', async () => {
    const inner = new FakeStorage()
    await inner.set('weeklySchedules', { schedules: [] })
    const provider = new PushNotifyingStorageProvider(inner)

    expect(await provider.get('weeklySchedules')).toEqual({ schedules: [] })
  })

  it('delegates onChange to inner', async () => {
    const inner = new FakeStorage()
    const provider = new PushNotifyingStorageProvider(inner)
    const cb = vi.fn()

    const unsubscribe = await provider.onChange('timerState', cb)

    expect(typeof unsubscribe).toBe('function')
  })
})
