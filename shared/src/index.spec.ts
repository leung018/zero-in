import { describe, expect, it } from 'vitest'
import { sharedExampleValue } from '.'

describe('index', () => {
  it('should work', () => {
    expect(sharedExampleValue).toBeGreaterThan(0)
  })
})
