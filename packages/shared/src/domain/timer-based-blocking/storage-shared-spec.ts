import { StorageInterface } from '@zero-in/shared/infra/storage/interface'
import { expect, it } from 'vitest'
import { TimerBasedBlockingRules } from '.'
import config from '../../config'
import { TimerBasedBlockingRulesStorageService } from './storage'

export function runTimerBasedBlockingRulesStorageServiceTests(storage: StorageInterface) {
  it('should get default integration setting when no integration setting is saved', async () => {
    const service = new TimerBasedBlockingRulesStorageService(storage)
    expect(await service.get()).toStrictEqual(config.getDefaultTimerBasedBlockingRules())
  })

  it('should save and get integration setting', async () => {
    const service = new TimerBasedBlockingRulesStorageService(storage)
    const integration: TimerBasedBlockingRules = {
      pauseBlockingDuringBreaks: false,
      pauseBlockingWhenTimerNotRunning: true
    }
    await service.save(integration)
    expect(await service.get()).toStrictEqual(integration)
  })
}
