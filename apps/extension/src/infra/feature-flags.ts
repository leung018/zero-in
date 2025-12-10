import { StorageInterface } from '@zero-in/shared/infra/storage/interface'
import { StorageKey } from '@zero-in/shared/infra/storage/key'
import { LocalStorageWrapper } from '@zero-in/shared/infra/storage/local-storage/index'
import { newLocalStorage } from './storage/local-storage'

export enum FeatureFlag {
  PLACE_HOLDER = 'place-holder',
  SIGN_IN = 'sign-in'
}

type FeatureFlagParameter = FeatureFlag | `${FeatureFlag}`

export class FeatureFlagsService {
  static readonly STORAGE_KEY: StorageKey = 'featureFlags'
  private storage: StorageInterface

  static createFake(): FeatureFlagsService {
    return new FeatureFlagsService(LocalStorageWrapper.createFake())
  }

  static init(): FeatureFlagsService {
    const service = FeatureFlagsService.create()
    // @ts-expect-error Adding to featureFlagsService to globalThis, so that easy to call it in the browser console.
    globalThis.featureFlagsService = service
    return service
  }

  private static create(): FeatureFlagsService {
    return new FeatureFlagsService(newLocalStorage())
  }

  private constructor(storage: StorageInterface) {
    this.storage = storage
  }

  async isEnabled(target: FeatureFlagParameter): Promise<boolean> {
    const flags = await this.getFlags()
    return flags[target] === true
  }

  async enable(target: FeatureFlagParameter): Promise<void> {
    const flags = await this.getFlags()
    flags[target] = true
    return this.saveFlags(flags)
  }

  async enableAll(): Promise<void> {
    for (const flag of Object.values(FeatureFlag)) {
      await this.enable(flag)
    }
  }

  async disable(target: FeatureFlagParameter): Promise<void> {
    const flags = await this.getFlags()
    delete flags[target]
    return this.saveFlags(flags)
  }

  async disableAll(): Promise<void> {
    const flags = await this.getFlags()
    for (const flag of Object.values(FeatureFlag)) {
      delete flags[flag]
    }
    return this.saveFlags(flags)
  }

  private async getFlags(): Promise<Record<string, boolean>> {
    const data = await this.storage.get(FeatureFlagsService.STORAGE_KEY)
    return data || {}
  }

  private async saveFlags(flags: Record<string, boolean>): Promise<void> {
    return this.storage.set(FeatureFlagsService.STORAGE_KEY, flags)
  }
}
