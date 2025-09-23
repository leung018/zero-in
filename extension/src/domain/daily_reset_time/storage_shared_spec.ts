import { expect, it } from 'vitest'
import { StorageInterface } from '../../infra/storage/interface'
import { Time } from '../time'
import { DailyResetTimeStorageService } from './storage'

export function runDailyResetTimeStorageServiceTests(storage: StorageInterface) {
  it('should return 00:00am if no DailyResetTime is saved', async () => {
    const service = new DailyResetTimeStorageService(storage)
    expect(await service.get()).toStrictEqual(new Time(0, 0))
  })

  it('should save and get DailyResetTime', async () => {
    const service = new DailyResetTimeStorageService(storage)
    const dailyResetTime = new Time(12, 59)

    await service.save(dailyResetTime)
    expect(await service.get()).toStrictEqual(dailyResetTime)
  })
}
