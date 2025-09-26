import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { retryUntilSuccess } from './retry'

describe('retryUntilSuccess', () => {
  let consoleErrorSpy: any

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    vi.useRealTimers()
  })

  it('should returns the result when the function succeeds on first try', async () => {
    const fn = vi.fn(async () => 'ok')

    const result = await retryUntilSuccess(fn)

    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  it('should retries after a failure and resolves when the function eventually succeeds', async () => {
    vi.useFakeTimers()

    let attempts = 0
    const fn = vi.fn(async () => {
      attempts += 1
      if (attempts < 2) throw new Error('boom')
      return 'done'
    })

    const p = retryUntilSuccess(fn, { retryIntervalMs: 1000, functionName: 'myFn' })

    // first attempt happens immediately
    expect(fn).toHaveBeenCalledTimes(1)

    // advance the timer so the retry delay resolves and wait for microtasks
    await vi.advanceTimersByTimeAsync(1000)

    const result = await p

    expect(result).toBe('done')
    expect(fn).toHaveBeenCalledTimes(2)
    expect(consoleErrorSpy).toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Function myFn failed, retrying...',
      expect.any(Error)
    )
  })
})
