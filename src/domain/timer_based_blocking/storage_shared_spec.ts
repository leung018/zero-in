import { expect, it } from 'vitest'
import { TimerBasedBlocking } from '.'
import config from '../../config'
import { StorageInterface } from '../../infra/storage/interface'
import { TimerBasedBlockingStorageService } from './storage'

export function runTimerBasedBlockingStorageServiceTests(storage: StorageInterface) {
  it('should get default integration setting when no integration setting is saved', async () => {
    const service = new TimerBasedBlockingStorageService(storage)
    expect(await service.get()).toStrictEqual(config.getDefaultTimerBasedBlocking())
  })

  it('should save and get integration setting', async () => {
    const service = new TimerBasedBlockingStorageService(storage)
    const integration: TimerBasedBlocking = {
      pauseBlockingDuringBreaks: false,
      pauseBlockingWhenTimerNotRunning: true
    }
    await service.save(integration)
    expect(await service.get()).toStrictEqual(integration)
  })
}
