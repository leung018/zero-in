export interface StorageInterface {
  get: (key: string) => Promise<any>
  set: (key: string, data: any) => Promise<void>
}

export interface ObservableStorage extends StorageInterface {
  // Note: Some storage implementations may not support change notifications,
  // in which case onChange will have no effect when called.
  onChange: (key: string, callback: (data: any) => void) => Promise<Unsubscribe>
}

export type Unsubscribe = () => void
