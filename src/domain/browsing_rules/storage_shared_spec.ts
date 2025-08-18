import { expect, it } from 'vitest'
import { BrowsingRules } from '.'
import { ObservableStorage } from '../../infra/storage/interface'
import { BrowsingRulesStorageService } from './storage'

export function runBrowsingRulesStorageServiceTests(storage: ObservableStorage) {
  it('should return BrowsingRules with empty blockedDomains if no BrowsingRules are saved', async () => {
    const service = new BrowsingRulesStorageService(storage)
    expect(await service.get()).toStrictEqual(new BrowsingRules())
  })

  it('should save and get BrowsingRules', async () => {
    const service = new BrowsingRulesStorageService(storage)
    const browsingRules = new BrowsingRules({ blockedDomains: ['example.com'] })

    await service.save(browsingRules)
    expect(await service.get()).toStrictEqual(browsingRules)
  })
}
