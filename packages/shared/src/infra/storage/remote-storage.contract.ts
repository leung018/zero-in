import { beforeEach, expect, it } from 'vitest'
import { RemoteStorage } from './interface'

/**
 * Shared contract test suite for RemoteStorage implementations.
 * Run against FakeRemoteStorage (unit) and FirestoreStorage (integration)
 * to guarantee both behave identically.
 */
export function testRemoteStorageContract(createStorage: () => Promise<RemoteStorage>) {
  let storage: RemoteStorage

  beforeEach(async () => {
    storage = await createStorage()
    for (const key of await storage.getKeys()) {
      await storage.delete(key)
    }
  })

  it('should be able to get and set data', async () => {
    await storage.set('test', { data: 'test_data' })
    expect(await storage.get('test')).toStrictEqual({ data: 'test_data' })
  })

  it('should reject setting a non-object value', async () => {
    await expect(storage.set('test', true)).rejects.toThrow()
  })

  it('should be able to listen for data changes', async () => {
    const dataList: any[] = []
    await storage.onChange('test', (data) => {
      dataList.push(data)
    })
    await storage.set('test', { data: 'test_data' })
    expect(dataList).toStrictEqual([{ data: 'test_data' }])
  })

  it('should onChange listen to data only if match the key', async () => {
    const dataList: any[] = []
    await storage.onChange('test', (data) => {
      dataList.push(data)
    })
    await storage.set('test2', { data: 'test_data' })
    expect(dataList).toStrictEqual([])
  })

  it('should return keys of set items', async () => {
    await storage.set('a', { value: 1 })
    await storage.set('b', { value: 2 })
    expect((await storage.getKeys()).sort()).toStrictEqual(['a', 'b'])
  })

  it('should be able to delete data', async () => {
    await storage.set('a', { value: 1 })
    await storage.set('b', { value: 2 })
    await storage.delete('a')
    expect(await storage.getKeys()).toStrictEqual(['b'])
    expect(await storage.get('a')).toBeUndefined()
  })

  it('should able to unsubscribe from onChange', async () => {
    const dataList1: any[] = []
    const unsubscribe1 = await storage.onChange('test', (data) => {
      dataList1.push(data)
    })

    const dataList2: any[] = []
    const unsubscribe2 = await storage.onChange('test', (data) => {
      dataList2.push(data)
    })

    await unsubscribe1()
    await storage.set('test', { data: 'test_data' })

    expect(dataList1).toStrictEqual([])
    expect(dataList2).toStrictEqual([{ data: 'test_data' }])

    await unsubscribe2()
    await storage.set('test', { data: 'test_data2' })
    expect(dataList2).toStrictEqual([{ data: 'test_data' }])
  })
}
