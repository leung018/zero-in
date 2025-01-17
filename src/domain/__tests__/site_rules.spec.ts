import { describe, expect, it } from 'vitest'
import { SiteRules } from '../site_rules'

describe('SiteRules', () => {
  it('should be able to import blocked domains', () => {
    const siteRules = new SiteRules({ blockedDomains: ['example.com', 'facebook.com'] })
    expect(siteRules.blockedDomains).toEqual(['example.com', 'facebook.com'])
  })

  it('should be able to remove duplicate in input', () => {
    const siteRules = new SiteRules({
      blockedDomains: ['example.com', 'facebook.com', 'example.com']
    })
    expect(siteRules.blockedDomains).toEqual(['example.com', 'facebook.com'])
  })

  it('should be able to automatically trim input', () => {
    const siteRules = new SiteRules({ blockedDomains: ['  example.com  ', 'facebook.com  '] })
    expect(siteRules.blockedDomains).toEqual(['example.com', 'facebook.com'])

    const siteRules2 = new SiteRules({ blockedDomains: ['  example.com  ', '  example.com  '] })
    expect(siteRules2.blockedDomains).toEqual(['example.com'])
  })
})
