export interface StorageInterface {
  get: (key: string) => Promise<any>
  set: (key: string, data: any) => Promise<void>
  onChange: (key: string, callback: (data: any) => void) => Promise<Unsubscribe>
}

export type Unsubscribe = () => void
