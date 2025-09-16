import { describe, expect, it } from 'vitest'
import { LocalStorageWrapper } from './local_storage'
import { newSettingStorageServicesMap } from './key'

describe('newSettingStorageServicesMap', () => {
  it('should initialize the services correctly', async () => {
    const services = newSettingStorageServicesMap(LocalStorageWrapper.createFake())

    // Verify each service is mapped to its correct storage key
    for (const [key, service] of Object.entries(services)) {
      expect(key).toBe((service.constructor as any).STORAGE_KEY)
    }
  })
})
