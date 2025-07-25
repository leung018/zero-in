import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { BlockingTimerIntegration } from '.'
import config from '../../config'
import { FirebaseServices } from '../../infra/firebase_services'
import type { BlockingTimerIntegrationSchemas } from './schema'
import { BlockingTimerIntegrationStorageService } from './storage'

describe('BlockingTimerIntegrationStorageService', () => {
  let service: BlockingTimerIntegrationStorageService

  beforeAll(async () => {
    // @ts-expect-error Exposed method
    await globalThis.signInWithTestCredential()
    const firebaseStorage = await FirebaseServices.getFirestoreStorage()
    service = new BlockingTimerIntegrationStorageService(firebaseStorage)
  })

  beforeEach(async () => {
    return FirebaseServices.getFirestoreStorage().then((storage) => {
      storage.delete(BlockingTimerIntegrationStorageService.STORAGE_KEY)
    })
  })

  it('should get default integration setting when no integration setting is saved', async () => {
    expect(await service.get()).toStrictEqual(config.getDefaultBlockingTimerIntegration())
  })

  it('should save and get integration setting', async () => {
    const integration: BlockingTimerIntegration = {
      pauseBlockingDuringBreaks: false,
      pauseBlockingWhenTimerNotRunning: true
    }
    await service.save(integration)
    expect(await service.get()).toStrictEqual(integration)
  })

  it('should migrate properly', async () => {
    const firebaseStorage = await FirebaseServices.getFirestoreStorage()
    const data: BlockingTimerIntegrationSchemas[0] = {
      shouldPauseBlockingDuringBreaks: true
    }
    firebaseStorage.set(BlockingTimerIntegrationStorageService.STORAGE_KEY, data)
    const service = new BlockingTimerIntegrationStorageService(firebaseStorage)
    const expected: BlockingTimerIntegration = {
      pauseBlockingDuringBreaks: true,
      pauseBlockingWhenTimerNotRunning: false
    }
    const result = await service.get()
    expect(result).toStrictEqual(expected)
  })
})
