export interface StorageInterface {
  get: (key: string) => Promise<any>
  set: (key: string, data: any) => Promise<void>
}

export interface RemoteStorage extends StorageInterface {
  delete: (key: string) => Promise<void>
  getKeys: () => Promise<string[]>
  onChange: (key: string, callback: (data: any) => void) => Promise<Unsubscribe>
}

export type Unsubscribe = () => void

export interface StorageService<T> {
  get(): Promise<T | null>
  save(data: T): Promise<void>
}
