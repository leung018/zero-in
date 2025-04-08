import { describe, expect, it } from 'vitest'
import { CurrentDateService } from './current_date'

describe('CurrentDateService', () => {
  it('should later call of getDate return later date', async () => {
    const currentDateService = CurrentDateService.create()

    const date1 = currentDateService.getDate()
    await new Promise((resolve) => setTimeout(resolve, 1))
    const date2 = currentDateService.getDate()

    expect(date1.getTime()).toBeLessThan(date2.getTime())
  })
})
