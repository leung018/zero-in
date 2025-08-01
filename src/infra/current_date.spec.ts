import { describe, expect, it } from 'vitest'
import { FakeTimeCounter } from '../utils/fake_time_counter'
import { CurrentDateService } from './current_date'

describe('CurrentDateService', () => {
  it('should later call of getDate return later date', async () => {
    const currentDateService = CurrentDateService.create()

    const date1 = currentDateService.getDate()
    await new Promise((resolve) => setTimeout(resolve, 2))
    const date2 = currentDateService.getDate()

    expect(date1.getTime()).toBeLessThan(date2.getTime())
  })

  it('should fakeTimeCounter can affect the getDate correctly', async () => {
    const fakeTimeCounter = new FakeTimeCounter()
    const currentDateService = CurrentDateService.createFake(
      new Date('2023-01-01T00:00:00Z'),
      fakeTimeCounter
    )

    fakeTimeCounter.advanceTime(1500)

    expect(currentDateService.getDate()).toEqual(new Date('2023-01-01T00:00:01.500Z'))
  })
})
