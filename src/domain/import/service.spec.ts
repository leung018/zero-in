import { describe, expect, it } from 'vitest'
import { LocalStorageWrapper } from '../../infra/storage/local_storage'
import { ImportService } from './service'

describe('ImportService', () => {
  it('should newSettingStorageServicesMap initialize the services correctly', async () => {
    const services = ImportService.newSettingStorageServicesMap(LocalStorageWrapper.createFake())

    for (const [key, service] of Object.entries(services)) {
      expect(key).toBe((service.constructor as any).STORAGE_KEY)
    }
  })
})
