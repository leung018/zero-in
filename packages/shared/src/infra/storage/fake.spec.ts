import { describe, expect, it } from 'vitest'
import { FakeRemoteStorage } from './fake'

describe('FakeRemoteStorage', () => {
  // TODO: Run same test suite against FirestoreStorage in integration test

  it('should be able to get and set data', async () => {
    const storage = FakeRemoteStorage.create()
    await storage.set('test', { data: 'test_data' })
    expect(await storage.get('test')).toStrictEqual({ data: 'test_data' })
  })

  it('should be able to listen for data changes', async () => {
    const storage = FakeRemoteStorage.create()
    const dataList: any[] = []
    await storage.onChange('test', (data) => {
      dataList.push(data)
    })
    await storage.set('test', { data: 'test_data' })
    expect(dataList).toStrictEqual([{ data: 'test_data' }])
  })

  it('should onChange listen to data only if match the key', async () => {
    const storage = FakeRemoteStorage.create()
    const dataList: any[] = []
    await storage.onChange('test', (data) => {
      dataList.push(data)
    })
    await storage.set('test2', { data: 'test_data' })
    expect(dataList).toStrictEqual([])
  })

  it('should return keys of set items', async () => {
    const storage = FakeRemoteStorage.create()
    await storage.set('a', 1)
    await storage.set('b', 2)
    expect(await storage.getKeys()).toStrictEqual(['a', 'b'])
  })

  it('should be able to delete data', async () => {
    const storage = FakeRemoteStorage.create()
    await storage.set('a', 1)
    await storage.set('b', 2)
    await storage.delete('a')
    expect(await storage.getKeys()).toStrictEqual(['b'])
    expect(await storage.get('a')).toBeUndefined()
  })

  it('should able to unsubscribe from onChange', async () => {
    const storage = FakeRemoteStorage.create()

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
})
