import { describe, expect, it } from 'vitest'
import { FakeClock } from '../utils/clock'
import { CurrentDateService } from './current_date'

describe('CurrentDateService', () => {
  it('should later call of getDate return later date', async () => {
    const currentDateService = CurrentDateService.create()

    const date1 = currentDateService.getDate()
    await new Promise((resolve) => setTimeout(resolve, 2))
    const date2 = currentDateService.getDate()

    expect(date1.getTime()).toBeLessThan(date2.getTime())
  })

  it('should fakeClock can affect the getDate correctly', async () => {
    const fakeClock = new FakeClock()
    const currentDateService = CurrentDateService.createFake({
      stubbedDate: new Date('2023-01-01T00:00:00Z'),
      fakeClock
    })

    fakeClock.advanceTime(1500)

    expect(currentDateService.getDate()).toEqual(new Date('2023-01-01T00:00:01.500Z'))
  })
})
