import { describe, expect, it } from 'vitest'
import { BrowsingRulesStorageService } from './storage'
import { BrowsingRules } from '.'

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
