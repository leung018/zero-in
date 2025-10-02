import { AssertionError } from 'assert'
import { expect } from 'vitest'

export function assertToThrowError(fn: () => void, errorInstance: Error) {
  try {
    fn()
  } catch (e) {
    expect(e).toEqual(errorInstance)
    expect(e).toBeInstanceOf(errorInstance.constructor)
    return
  }
  throw new AssertionError({ message: 'Expected function to throw an error, but it did not.' })
}
