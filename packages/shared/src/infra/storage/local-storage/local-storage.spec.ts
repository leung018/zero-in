import { describe, expect, it } from 'vitest'
import { FakeLocalStorage } from './local-storage'

describe('FakeLocalStorage', () => {
  // Make sure it behave similarly as real extension local storage api

  it('should set and get values correctly', async () => {
    const storage = new FakeLocalStorage()
    await storage.set({ key1: 'value1' })

    const testObj = {
      num: 123,
      obj: {
        key: 'value'
      }
    }
    await storage.set({
      key2: testObj
    })

    expect(await storage.get('key1')).toEqual({ key1: 'value1' })
    expect(await storage.get('key2')).toEqual({ key2: testObj })
    expect(await storage.get('nonexistent_key')).toEqual({ nonexistent_key: undefined })
  })

  it('should not preserve instance type', async () => {
    const storage = new FakeLocalStorage()
    const dummy = new Dummy()
    await storage.set({ dummy })

    const result = await storage.get('dummy')
    expect(result.dummy).not.toStrictEqual(dummy)
  })

  it('should remove undefined properties', async () => {
    const storage = new FakeLocalStorage()
    await storage.set({
      key1: {
        b: undefined
      }
    })

    const result = await storage.get('key1')
    expect(result.key1).toStrictEqual({})
  })

  it('should preserve null value', async () => {
    const storage = new FakeLocalStorage()
    await storage.set({
      key1: {
        b: null
      }
    })

    const result = await storage.get('key1')
    expect(result.key1).toStrictEqual({ b: null })
  })
})

class Dummy {
  getDummy() {
    return 'dummy'
  }
}
