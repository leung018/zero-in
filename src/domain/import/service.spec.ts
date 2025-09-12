import { describe, expect, it } from 'vitest'
import { LocalStorageWrapper } from '../../infra/storage/local_storage'
import { TimerConfig } from '../timer/config'
import { TimerConfigStorageService } from '../timer/config/storage'
import { Duration } from '../timer/duration'
import { ImportService } from './service'

describe('ImportService', () => {
  it('should newSettingStorageServicesMap initialize the services correctly', async () => {
    const services = ImportService.newSettingStorageServicesMap(LocalStorageWrapper.createFake())

    for (const [key, service] of Object.entries(services)) {
      expect(key).toBe((service.constructor as any).STORAGE_KEY)
    }
  })

  it('should importFromLocalToRemote can import the local setting storage to remote setting storage', async () => {
    /* This test doesn't need to check all storage types, assuming ImportService
     * correctly handles the import process via newSettingStorageServicesMap.
     *
     * Since the previous test verifies that newSettingStorageServicesMap initializes
     * services correctly, testing one storage service import validates that all
     * storage service imports work correctly. */

    const localStorage = LocalStorageWrapper.createFake()
    const remoteStorage = LocalStorageWrapper.createFake()

    const importService = ImportService.createFake({
      localStorage,
      remoteStorage
    })

    const localTimerConfigStorageService = new TimerConfigStorageService(localStorage)
    const remoteTimerConfigStorageService = new TimerConfigStorageService(remoteStorage)

    const nonDefaultValue = TimerConfig.newTestInstance({
      focusDuration: new Duration({
        minutes: 1
      })
    })
    await localTimerConfigStorageService.save(nonDefaultValue)

    await importService.importFromLocalToRemote()
    const remoteValue = await remoteTimerConfigStorageService.get()
    expect(remoteValue).toEqual(nonDefaultValue)
  })
})
