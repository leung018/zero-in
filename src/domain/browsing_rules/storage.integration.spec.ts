import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { BrowsingRules } from '.'
import { FirebaseServices } from '../../infra/firebase_services'
import { BrowsingRulesStorageService } from './storage'

describe('BrowsingRulesStorageService', () => {
  let browsingRulesStorageService: BrowsingRulesStorageService

  beforeAll(async () => {
    // @ts-expect-error Exposed method
    await globalThis.signInWithTestCredential()
    const firebaseStorage = await FirebaseServices.getFirestoreStorage()
    browsingRulesStorageService = new BrowsingRulesStorageService(firebaseStorage)
  })

  beforeEach(async () => {
    return FirebaseServices.getFirestoreStorage().then((storage) => {
      storage.delete(BrowsingRulesStorageService.STORAGE_KEY)
    })
  })

  it('should return BrowsingRules with empty blockedDomains if no BrowsingRules are saved', async () => {
    expect(await browsingRulesStorageService.get()).toStrictEqual(new BrowsingRules())
  })

  it('should save and get BrowsingRules', async () => {
    const browsingRules = new BrowsingRules({ blockedDomains: ['example.com'] })

    await browsingRulesStorageService.save(browsingRules)
    expect(await browsingRulesStorageService.get()).toStrictEqual(browsingRules)
  })
})
