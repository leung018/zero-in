import { describe, expect, it } from 'vitest'
import { Time } from '../time'
import { DailyResetTimeStorageService } from './storage'

describe('DailyResetTimeStorageService', () => {
  it('should return 00:00am if no DailyResetTime is saved', async () => {
    const dailyResetTimeStorageService = DailyResetTimeStorageService.createFake()
    expect(await dailyResetTimeStorageService.get()).toStrictEqual(new Time(0, 0))
  })

  it('should save and get DailyResetTime', async () => {
    const dailyResetTimeStorageService = DailyResetTimeStorageService.createFake()
    const dailyResetTime = new Time(12, 59)

    await dailyResetTimeStorageService.save(dailyResetTime)
    expect(await dailyResetTimeStorageService.get()).toStrictEqual(dailyResetTime)
  })
})
