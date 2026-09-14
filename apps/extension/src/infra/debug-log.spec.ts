import { describe, expect, it } from 'vitest'
import { DebugLog } from './debug-log'

describe('DebugLog', () => {
  it('should keep only the latest entries up to maxEntries, in order', async () => {
    const debugLog = DebugLog.createFake({ maxEntries: 2 })

    debugLog.log('first')
    debugLog.log('second', { detail: 1 })
    debugLog.log('third')

    const entries = await debugLog.getEntries()
    expect(entries.map((entry) => entry.event)).toEqual(['second', 'third'])
    expect(entries[0]).toMatchObject({ event: 'second', detail: 1 })
    expect(entries[0].at).toBeTypeOf('string')
  })
})
