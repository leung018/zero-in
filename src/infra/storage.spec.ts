import { describe, expect, it } from 'vitest'
import { FakeStorage, StorageWrapper } from './storage'

describe('FakeStorage', () => {
  it('should set and get values correctly', async () => {
    const storage = new FakeStorage()
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
    const storage = new FakeStorage()
    const dummy = new Dummy()
    await storage.set({ dummy })

    const result = await storage.get('dummy')
    expect(result.dummy).not.toStrictEqual(dummy)
  })

  it('should remove undefined properties', async () => {
    const storage = new FakeStorage()
    await storage.set({
      key1: {
        b: undefined
      }
    })

    const result = await storage.get('key1')
    expect(result.key1).toStrictEqual({})
  })

  it('should preserve null value', async () => {
    const storage = new FakeStorage()
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

describe('StorageWrapper', () => {
  it('should set and get the data properly', async () => {
    type NewSchema = {
      dataVersion: 1
      fullname: string
    }

    const storageWrapper = StorageWrapper.createFake<NewSchema>({
      currentDataVersion: 1
    })

    const data: NewSchema = {
      dataVersion: 1,
      fullname: 'John Doe'
    }

    await storageWrapper.set(data)
    const result = await storageWrapper.get()
    expect(result).toEqual(data)
  })

  it('should get old version and migrate to new version', async () => {
    const fakeStorage = new FakeStorage()
    type OldestSchema = {
      name: string
    }

    type V1Schema = {
      dataVersion: 1
      myName: string
    }

    type V2Schema = {
      dataVersion: 2
      fullname: string
    }

    const storageWrapper = StorageWrapper.createFake<V2Schema>({
      storage: fakeStorage,
      migrators: [
        {
          migratorFunc: (oldData: OldestSchema): V1Schema => {
            return {
              dataVersion: 1,
              myName: oldData.name
            }
          },
          oldDataVersion: undefined
        },
        {
          migratorFunc: (v1Data: V1Schema): V2Schema => {
            return {
              dataVersion: 2,
              fullname: v1Data.myName
            }
          },
          oldDataVersion: 1
        }
      ],
      key: 'key1',
      currentDataVersion: 2
    })

    // Migrating from OldestSchema
    const oldData: OldestSchema = {
      name: 'John Doe'
    }

    fakeStorage.set({
      key1: oldData
    })
    let result = await storageWrapper.get()
    expect(result).toEqual({
      dataVersion: 2,
      fullname: 'John Doe'
    })

    // Migrating from V1Schema
    const v1Data: V1Schema = {
      dataVersion: 1,
      myName: 'Ben Johnson'
    }
    fakeStorage.set({
      key1: v1Data
    })
    result = await storageWrapper.get()
    expect(result).toEqual({
      dataVersion: 2,
      fullname: 'Ben Johnson'
    })
  })
})
