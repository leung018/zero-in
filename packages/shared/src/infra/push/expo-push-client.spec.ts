import { describe, expect, it } from 'vitest'
import { parseExpoPushResponse } from './expo-push-client'

describe('parseExpoPushResponse', () => {
  it('returns empty when all tickets are ok', () => {
    const body = { data: [{ status: 'ok' }, { status: 'ok' }] }
    const tokens = ['t1', 't2']
    expect(parseExpoPushResponse(body, tokens)).toEqual({ deviceNotRegisteredTokens: [] })
  })

  it('collects tokens whose ticket has DeviceNotRegistered error', () => {
    const body = {
      data: [
        { status: 'ok' },
        { status: 'error', details: { error: 'DeviceNotRegistered' } },
        { status: 'error', details: { error: 'MessageTooBig' } },
        { status: 'error', details: { error: 'DeviceNotRegistered' } }
      ]
    }
    const tokens = ['t1', 't2', 't3', 't4']
    expect(parseExpoPushResponse(body, tokens)).toEqual({ deviceNotRegisteredTokens: ['t2', 't4'] })
  })

  it('handles a single-object data shape (non-array)', () => {
    const body = { data: { status: 'error', details: { error: 'DeviceNotRegistered' } } }
    expect(parseExpoPushResponse(body, ['only'])).toEqual({
      deviceNotRegisteredTokens: ['only']
    })
  })

  it('returns empty when body is missing data', () => {
    expect(parseExpoPushResponse({}, ['t1'])).toEqual({ deviceNotRegisteredTokens: [] })
  })
})
