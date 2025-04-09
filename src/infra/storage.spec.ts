import { describe, expect, it } from 'vitest'
import { FakeStorage } from './storage'

describe('FakeStorage', () => {
  it('should set and get values correctly', async () => {
    const storage = new FakeStorage()
    await storage.set({ key1: 'value1' })

    expect(await storage.get('key1')).toEqual({ key1: 'value1' })
    expect(await storage.get('key2')).toEqual({ key2: undefined })
  })
})
