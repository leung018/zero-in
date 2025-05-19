import { describe, expect, it } from 'vitest'
import { BrowsingRules } from '.'
import { BrowsingRulesStorageService } from './storage'

describe('BrowsingRulesStorageService', () => {
  it('should return BrowsingRules with empty blockedDomains if no BrowsingRules are saved', async () => {
    const browsingRulesStorageService = BrowsingRulesStorageService.createFake()
    expect(await browsingRulesStorageService.get()).toStrictEqual(new BrowsingRules())
  })

  it('should save and get BrowsingRules', async () => {
    const browsingRulesStorageService = BrowsingRulesStorageService.createFake()
    const browsingRules = new BrowsingRules({ blockedDomains: ['example.com'] })

    await browsingRulesStorageService.save(browsingRules)
    expect(await browsingRulesStorageService.get()).toStrictEqual(browsingRules)
  })
})
