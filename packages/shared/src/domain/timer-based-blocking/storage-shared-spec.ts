import { RemoteStorage } from '@zero-in/shared/infra/storage/interface'
import { expect, it } from 'vitest'
import { newTestTimerBasedBlockingRules, TimerBasedBlockingRules } from '.'
import config from '../../config'
import { TimerBasedBlockingRulesStorageService } from './storage'

export function runTimerBasedBlockingRulesStorageServiceTests(storage: RemoteStorage) {
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

  it('should onChange triggered when integration setting is saved and unsubscribeAll can unsubscribe', async () => {
    const service = new TimerBasedBlockingRulesStorageService(storage)
    const results: TimerBasedBlockingRules[] = []
    await service.onChange((data) => {
      results.push(data)
    })

    const targetRules = newTestTimerBasedBlockingRules()
    await service.save(targetRules)
    expect(results).toEqual([targetRules])

    service.unsubscribeAll()
    await service.save(targetRules)
    expect(results).toEqual([targetRules])
  })
}
