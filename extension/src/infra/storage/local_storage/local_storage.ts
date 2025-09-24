export interface LocalStorage {
  set<T = { [key: string]: any }>(items: Partial<T>): Promise<void>
  get<T = { [key: string]: any }>(key: NoInfer<keyof T>): Promise<T>
}

/**
 * Use LocalStorageWrapper.createFake instead of using this class.
 * This class only aims for simulate extension local storage.
 */
export class FakeLocalStorage implements LocalStorage {
  private storage: any = {}

  async set<T = { [key: string]: any }>(items: Partial<T>): Promise<void> {
    const processedUpdate = JSON.parse(JSON.stringify(items))
    this.storage = { ...this.storage, ...processedUpdate }
  }

  async get<T = { [key: string]: any }>(key: NoInfer<keyof T>): Promise<T> {
    return { [key]: this.storage[key] } as T
  }
}
