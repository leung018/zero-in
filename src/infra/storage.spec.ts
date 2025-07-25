import { describe, expect, it } from 'vitest'
import { FakeLocalStorage, StorageManager } from './storage'

describe('FakeStorage', () => {
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

describe('StorageManager', () => {
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

  const migrators = [
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
  ]

  it('should get null if no data is saved', async () => {
    const storageManager = StorageManager.createFake({
      storage: new FakeLocalStorage()
    })

    expect(await storageManager.get()).toBeNull()
  })

  it('should set and get the data properly', async () => {
    const storageManager = StorageManager.createFake({
      currentDataVersion: 2
    })

    const data: V2Schema = {
      dataVersion: 2,
      fullname: 'John Doe'
    }

    await storageManager.set(data)
    const result = await storageManager.get()
    expect(result).toEqual(data)
  })

  it('should get old version and migrate to new version', async () => {
    const fakeStorage = new FakeLocalStorage()

    const storageManager = StorageManager.createFake({
      storage: fakeStorage,
      migrators,
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
    let result = await storageManager.get()
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
    result = await storageManager.get()
    expect(result).toEqual({
      dataVersion: 2,
      fullname: 'Ben Johnson'
    })
  })

  it('should return original data if no migrators are provided', async () => {
    const data: OldestSchema = {
      name: 'John Doe'
    }

    const storageManager = StorageManager.createFake({
      migrators: [],
      currentDataVersion: 999
    })

    await storageManager.set(data)
    expect(await storageManager.get()).toEqual(data)
  })

  it.each([
    {
      oldData: {
        name: 'John Doe'
      },
      currentDataVersion: undefined
    },
    {
      oldData: {
        dataVersion: 1,
        myName: 'John Doe'
      },
      currentDataVersion: 1
    }
  ])(
    'should not migrate if dataVersion is same as currentDataVersion',
    async ({ oldData, currentDataVersion }) => {
      const fakeStorage = new FakeLocalStorage()

      const storageManager = StorageManager.createFake({
        storage: fakeStorage,
        migrators,
        key: 'key1',
        currentDataVersion
      })

      fakeStorage.set({
        key1: oldData
      })

      const result = await storageManager.get()
      expect(result).toEqual(oldData)
    }
  )

  it('should migrate up to the current data version only', async () => {
    const fakeStorage = new FakeLocalStorage()

    const storageManager = StorageManager.createFake({
      storage: fakeStorage,
      migrators,
      key: 'key1',
      currentDataVersion: 1
    })

    const oldData: OldestSchema = {
      name: 'John Doe'
    }

    fakeStorage.set({
      key1: oldData
    })

    const expected: V1Schema = {
      dataVersion: 1,
      myName: 'John Doe'
    }

    expect(await storageManager.get()).toEqual(expected)
  })
})
