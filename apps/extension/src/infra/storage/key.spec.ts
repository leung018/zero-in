import { describe, expect, it } from 'vitest'
import { newSettingStorageServicesMap } from './key'
import { LocalStorageWrapper } from './local-storage'

describe('newSettingStorageServicesMap', () => {
  it('should initialize the services correctly', async () => {
    const services = newSettingStorageServicesMap(LocalStorageWrapper.createFake())

    // Verify each service is mapped to its correct storage key
    for (const [key, service] of Object.entries(services)) {
      expect(key).toBe((service.constructor as any).STORAGE_KEY)
    }
  })
})
