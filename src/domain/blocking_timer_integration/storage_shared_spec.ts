import { expect, it } from 'vitest'
import { BlockingTimerIntegration } from '.'
import config from '../../config'
import { StorageInterface } from '../../infra/storage/interface'
import { BlockingTimerIntegrationStorageService } from './storage'

export function runBlockingTimerIntegrationStorageServiceTests(storage: StorageInterface) {
  it('should get default integration setting when no integration setting is saved', async () => {
    const service = new BlockingTimerIntegrationStorageService(storage)
    expect(await service.get()).toStrictEqual(config.getDefaultBlockingTimerIntegration())
  })

  it('should save and get integration setting', async () => {
    const service = new BlockingTimerIntegrationStorageService(storage)
    const integration: BlockingTimerIntegration = {
      pauseBlockingDuringBreaks: false,
      pauseBlockingWhenTimerNotRunning: true
    }
    await service.save(integration)
    expect(await service.get()).toStrictEqual(integration)
  })
}
