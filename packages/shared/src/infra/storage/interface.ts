export interface StorageInterface {
  get: (key: string) => Promise<any>
  set: (key: string, data: any) => Promise<void>
}

export interface ObservableStorage extends StorageInterface {
  onChange: (key: string, callback: (data: any) => void) => Promise<Unsubscribe>
}

export interface RemoteStorage extends ObservableStorage {
  delete: (key: string) => Promise<void>
  getKeys: () => Promise<string[]>
}

export type Unsubscribe = () => void

export interface StorageService<T> {
  get(): Promise<T | null>
  save(data: T): Promise<void>
}
