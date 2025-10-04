import { describe, expect, it } from 'vitest'
import { FeatureFlag, FeatureFlagsService } from './feature-flags'

describe('FeatureFlagsService', () => {
  it('should isEnabled return false if no feature flag has been enabled', async () => {
    const service = FeatureFlagsService.createFake()
    const isEnabled = await service.isEnabled('sign-in')
    expect(isEnabled).toBe(false)
  })

  it('should isEnabled return true for enabled feature flag only', async () => {
    const service = FeatureFlagsService.createFake()
    await service.enable('sign-in')

    expect(await service.isEnabled('sign-in')).toBe(true)
    expect(await service.isEnabled(FeatureFlag.SIGN_IN)).toBe(true)

    expect(await service.isEnabled('place-holder')).toBe(false)
  })

  it('should able to disable the enabled flag', async () => {
    const service = FeatureFlagsService.createFake()
    await service.enable('place-holder')
    await service.enable('sign-in')

    await service.disable('place-holder')
    expect(await service.isEnabled('place-holder')).toBe(false)

    expect(await service.isEnabled('sign-in')).toBe(true)
  })

  it('should enableAll', async () => {
    const service = FeatureFlagsService.createFake()
    await service.enableAll()

    expect(await service.isEnabled('sign-in')).toBe(true)
    expect(await service.isEnabled('place-holder')).toBe(true)
  })

  it('should disableAll', async () => {
    const service = FeatureFlagsService.createFake()
    await service.enableAll()
    await service.disableAll()

    expect(await service.isEnabled('sign-in')).toBe(false)
    expect(await service.isEnabled('place-holder')).toBe(false)
  })
})
