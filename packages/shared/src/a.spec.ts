import { describe, expect, it } from 'vitest'
import { DEMO_CONST } from './a'

describe('a', () => {
  it('should work', () => {
    expect(DEMO_CONST).toBeTypeOf('string')
  })
})
