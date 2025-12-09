import { LocalStorageWrapper } from '@zero-in/shared/infra/storage/local-storage/index'
import { describe, expect, it } from 'vitest'
import { newSettingStorageServicesMap } from './settings'

describe('newSettingStorageServicesMap', () => {
  it('should initialize the services correctly', async () => {
    const services = newSettingStorageServicesMap(LocalStorageWrapper.createFake())

    // Verify each service is mapped to its correct storage key
    for (const [key, service] of Object.entries(services)) {
      expect(key).toBe((service.constructor as any).STORAGE_KEY)
    }
  })
})
