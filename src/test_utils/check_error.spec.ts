import { describe, expect, it } from 'vitest'
import { assertToThrowError } from './check_error'
import { AssertionError } from 'assert'

class AError extends Error {}
class BError extends Error {}

describe('assertToThrowError', () => {
  it('should assert fail if target function do not throw error', () => {
    expect(() => {
      assertToThrowError(() => {}, new Error())
    }).toThrow(AssertionError)
    expect(() => {
      assertToThrowError(() => {}, new Error())
    }).toThrow('Expected function to throw an error, but it did not.')
  })

  it('should assert fail if error instance type is not matched', () => {
    const msg = 'hello'
    expect(() => {
      assertToThrowError(() => {
        throw new AError(msg)
      }, new BError(msg))
    }).toThrow()
  })

  it('should assert fail if error message is not matched', () => {
    expect(() => {
      assertToThrowError(() => {
        throw new AError('hello')
      }, new AError('world'))
    }).toThrow()
  })

  it('should assert success if instance variable is also matched', () => {
    const msg = 'hello'
    assertToThrowError(() => {
      throw new AError(msg)
    }, new AError(msg))
  })
})
