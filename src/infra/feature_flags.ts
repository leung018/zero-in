import { BrowserStorageProvider } from './browser/storage'
import { FakeStorage, Storage } from './storage'

export class FeatureFlagsService {
  static readonly STORAGE_KEY = 'featureFlags'
  private storage: Storage

  static createFake(): FeatureFlagsService {
    return new FeatureFlagsService(new FakeStorage())
  }

  static init(): FeatureFlagsService {
    const service = FeatureFlagsService.create()
    // @ts-expect-error Adding to featureFlagsService to globalThis, so that easy to call it in the browser console.
    globalThis.featureFlagsService = service
    return service
  }

  private static create(): FeatureFlagsService {
    return new FeatureFlagsService(BrowserStorageProvider.getLocalStorage())
  }

  private constructor(storage: Storage) {
    this.storage = storage
  }

  async isEnabled(flag: string): Promise<boolean> {
    const storedFlags = await this.getFlags()
    return storedFlags[flag] === true
  }

  async enable(flag: string): Promise<void> {
    const storedFlags = await this.getFlags()
    storedFlags[flag] = true
    return this.storage.set({ [FeatureFlagsService.STORAGE_KEY]: storedFlags })
  }

  private async getFlags(): Promise<Record<string, boolean>> {
    const data = await this.storage.get(FeatureFlagsService.STORAGE_KEY)
    return data[FeatureFlagsService.STORAGE_KEY] || {}
  }
}
