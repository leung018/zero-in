import { describe, expect, it } from 'vitest'
import { BrowsingRules } from '.'

describe('BrowsingRules', () => {
  it('should be able to import blocked domains', () => {
    const browsingRules = new BrowsingRules({ blockedDomains: ['example.com', 'facebook.com'] })
    expect(browsingRules.blockedDomains).toEqual(['example.com', 'facebook.com'])
  })

  it('should be able to remove duplicate in input', () => {
    const browsingRules = new BrowsingRules({
      blockedDomains: ['example.com', 'facebook.com', 'example.com']
    })
    expect(browsingRules.blockedDomains).toEqual(['example.com', 'facebook.com'])
  })

  it('should be able to automatically trim input', () => {
    const browsingRules = new BrowsingRules({
      blockedDomains: ['  example.com  ', 'facebook.com  ']
    })
    expect(browsingRules.blockedDomains).toEqual(['example.com', 'facebook.com'])

    const browsingRules2 = new BrowsingRules({
      blockedDomains: ['  example.com  ', '  example.com  ']
    })
    expect(browsingRules2.blockedDomains).toEqual(['example.com'])
  })

  it('should ignore empty input', () => {
    const browsingRules = new BrowsingRules({
      blockedDomains: ['example.com', '', '   ', 'facebook.com']
    })
    expect(browsingRules.blockedDomains).toEqual(['example.com', 'facebook.com'])
  })

  describe('isUrlBlocked', () => {
    it('should return false if url is not blocked', () => {
      expect(new BrowsingRules().isUrlBlocked('https://www.example.com')).toBe(false)
      expect(
        new BrowsingRules({ blockedDomains: ['facebook.com'] }).isUrlBlocked('https://example.com')
      ).toBe(false)
      expect(
        new BrowsingRules({ blockedDomains: ['google.com'] }).isUrlBlocked('https://google.company')
      ).toBe(false)
    })

    it('should return true if url is blocked', () => {
      expect(
        new BrowsingRules({ blockedDomains: ['example.com'] }).isUrlBlocked(
          'https://www.example.com'
        )
      ).toBe(true)
      expect(
        new BrowsingRules({ blockedDomains: ['example.com', 'facebook.com'] }).isUrlBlocked(
          'https://example.com'
        )
      )
    })
  })
})
