import { describe, expect, it } from 'vitest'
import { FakeObservableStorage } from './fake'

describe('FakeObservableStorage', () => {
  it('should be able to get and set data', async () => {
    const storage = FakeObservableStorage.create()
    await storage.set('test', { data: 'test_data' })
    expect(await storage.get('test')).toStrictEqual({ data: 'test_data' })
  })

  it('should be able to listen for data changes', async () => {
    const storage = FakeObservableStorage.create()
    const dataList: any[] = []
    await storage.onChange('test', (data) => {
      dataList.push(data)
    })
    await storage.set('test', { data: 'test_data' })
    expect(dataList).toStrictEqual([{ data: 'test_data' }])
  })

  it('should onChange listen to data only if match the key', async () => {
    const storage = FakeObservableStorage.create()
    const dataList: any[] = []
    await storage.onChange('test', (data) => {
      dataList.push(data)
    })
    await storage.set('test2', { data: 'test_data' })
    expect(dataList).toStrictEqual([])
  })

  it('should able to unsubscribe from onChange', async () => {
    const storage = FakeObservableStorage.create()

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
