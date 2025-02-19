export interface StorageHandler {
  set(obj: any): Promise<void>
  get(key: string): Promise<any>
}

export class FakeChromeLocalStorage implements StorageHandler {
  private storage: any = {}

  async set(update: any): Promise<void> {
    this.storage = { ...this.storage, ...update }
  }

  async get(key: string): Promise<any> {
    return { [key]: this.storage[key] }
  }
}
