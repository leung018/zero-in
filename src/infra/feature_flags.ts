import { StorageInterface } from './storage/interface'
import { LocalStorageWrapper } from './storage/local_storage_wrapper'

export class FeatureFlagsService {
  static readonly STORAGE_KEY = 'featureFlags'
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
    return new FeatureFlagsService(LocalStorageWrapper.create())
  }

  private constructor(storage: StorageInterface) {
    this.storage = storage
  }

  async isEnabled(target: string): Promise<boolean> {
    const flags = await this.getFlags()
    return flags[target] === true
  }

  async enable(target: string): Promise<void> {
    const flags = await this.getFlags()
    flags[target] = true
    return this.setFlags(flags)
  }

  async disable(target: string): Promise<void> {
    const flags = await this.getFlags()
    delete flags[target]
    return this.setFlags(flags)
  }

  private async getFlags(): Promise<Record<string, boolean>> {
    const data = await this.storage.get(FeatureFlagsService.STORAGE_KEY)
    return data || {}
  }

  private async setFlags(flags: Record<string, boolean>): Promise<void> {
    return this.storage.set(FeatureFlagsService.STORAGE_KEY, flags)
  }
}
