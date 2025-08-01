import { describe, expect, it } from 'vitest'
import { FeatureFlagsService } from './feature_flags'

describe('FeatureFlagsService', () => {
  it('should isEnabled return false if no feature flag has been enabled', async () => {
    const service = FeatureFlagsService.createFake()
    const isEnabled = await service.isEnabled('non_existing_flag')
    expect(isEnabled).toBe(false)
  })

  it('should isEnabled return true for enabled feature flag only', async () => {
    const service = FeatureFlagsService.createFake()
    await service.enable('enabled_flag')

    let isEnabled = await service.isEnabled('enabled_flag')
    expect(isEnabled).toBe(true)

    isEnabled = await service.isEnabled('non_enabled_flag')
    expect(isEnabled).toBe(false)
  })

  it('should able to disable the enabled flag', async () => {
    const service = FeatureFlagsService.createFake()
    await service.enable('flag1')
    await service.enable('flag2')

    await service.disable('flag1')
    let isEnabled = await service.isEnabled('flag1')
    expect(isEnabled).toBe(false)

    isEnabled = await service.isEnabled('flag2')
    expect(isEnabled).toBe(true)
  })
})
