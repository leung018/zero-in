import { FakeClock } from '@/utils/clock'
import { describe, expect, it } from 'vitest'
import { AlarmsManager } from './manager'

describe('AlarmsManager', () => {
  it('should create an alarm fire once at specified time', async () => {
    const clock = new FakeClock()

    let counter = 0
    const manager = AlarmsManager.createFake({
      listeners: {
        testAlarm: () => {
          counter++
        }
      },
      fakeClock: clock,
      stubbedDate: new Date('2023-01-01T00:00:00Z')
    })

    await manager.createAlarm('testAlarm', { when: new Date('2023-01-01T00:00:10Z') })

    clock.advanceTime(9999)
    expect(counter).toBe(0)

    clock.advanceTime(1)
    expect(counter).toBe(1)

    clock.advanceTime(2)
    expect(counter).toBe(1)
  })
})
