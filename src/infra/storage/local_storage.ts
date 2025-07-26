export interface LocalStorage {
  set(obj: any): Promise<void>
  get(key: string): Promise<any>
}

/**
 * Use LocalStorageWrapper.createFake instead of using this class.
 * This class only aim for simulate extension local storage and provide fake implementation of LocalStorageWrapper.
 */
export class FakeLocalStorage implements LocalStorage {
  private storage: any = {}

  async set(update: any): Promise<void> {
    const processedUpdate = JSON.parse(JSON.stringify(update))
    this.storage = { ...this.storage, ...processedUpdate }
  }

  async get(key: string): Promise<any> {
    return { [key]: this.storage[key] }
  }
}
