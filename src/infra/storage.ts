export interface Storage {
  set(obj: any): Promise<void>
  get(key: string): Promise<any>
}

export class FakeStorage implements Storage {
  private storage: any = {}

  async set(update: any): Promise<void> {
    const processedUpdate = JSON.parse(JSON.stringify(update))
    this.storage = { ...this.storage, ...processedUpdate }
  }

  async get(key: string): Promise<any> {
    return { [key]: this.storage[key] }
  }
}
