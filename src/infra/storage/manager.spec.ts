import { describe, expect, it } from 'vitest'
import { FakeObservableStorage } from './fake'
import { StorageManager } from './manager'

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
      storage: FakeObservableStorage.create()
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

  it('should able to subscribe and unsubscribe change of data', async () => {
    const storageManager = StorageManager.createFake({
      currentDataVersion: 2
    })

    const data: V2Schema = {
      dataVersion: 2,
      fullname: 'John Doe'
    }

    const dataList: V2Schema[] = []
    const unsubscribe = await storageManager.onChange((newData) => {
      dataList.push(newData as V2Schema)
    })
    await storageManager.set(data)
    expect(dataList).toEqual([data])

    unsubscribe()
    const data2: V2Schema = {
      dataVersion: 2,
      fullname: 'Jane Smith'
    }
    await storageManager.set(data2)
    expect(dataList).toEqual([data])
  })

  it('should get old version and migrate to new version', async () => {
    const fakeStorage = FakeObservableStorage.create()

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

    fakeStorage.set('key1', oldData)
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
    fakeStorage.set('key1', v1Data)
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
      const fakeStorage = FakeObservableStorage.create()

      const storageManager = StorageManager.createFake({
        storage: fakeStorage,
        migrators,
        key: 'key1',
        currentDataVersion
      })

      fakeStorage.set('key1', oldData)

      const result = await storageManager.get()
      expect(result).toEqual(oldData)
    }
  )

  it('should migrate up to the current data version only', async () => {
    const fakeStorage = FakeObservableStorage.create()

    const storageManager = StorageManager.createFake({
      storage: fakeStorage,
      migrators,
      key: 'key1',
      currentDataVersion: 1
    })

    const oldData: OldestSchema = {
      name: 'John Doe'
    }

    fakeStorage.set('key1', oldData)

    const expected: V1Schema = {
      dataVersion: 1,
      myName: 'John Doe'
    }

    expect(await storageManager.get()).toEqual(expected)
  })
})
