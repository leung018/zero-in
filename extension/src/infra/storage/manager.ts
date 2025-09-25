import {
  ObservableStorage,
  StorageInterface,
  Unsubscribe
} from '../../../../shared/src/infra/storage/interface'
import { FakeObservableStorage } from './fake'
import { StorageKey } from './key'

interface Schema {
  dataVersion: number
}

type MigratorFunc = (oldData: any) => Schema

type Migrator = { oldDataVersion?: number; migratorFunc: MigratorFunc }

type Migrators = ReadonlyArray<Migrator>

function getVersion(version: number | undefined) {
  return version ?? -Infinity
}

export class StorageManager<S> {
  private storage: ObservableStorage | StorageInterface
  private key: string
  private migrators: Migrators
  private currentDataVersion?: number

  static create<S>({
    storage,
    key,
    migrators,
    currentDataVersion
  }: {
    storage: ObservableStorage | StorageInterface
    key: StorageKey
    migrators: Migrators
    currentDataVersion?: number
  }): StorageManager<S> {
    return new StorageManager({
      storage,
      key,
      migrators,
      currentDataVersion
    })
  }

  static createFake<S>({
    storage = FakeObservableStorage.create(),
    migrators = [] as Migrators,
    key = 'STORAGE_KEY',
    currentDataVersion = undefined as number | undefined
  }): StorageManager<S> {
    return new StorageManager({
      storage,
      key,
      migrators,
      currentDataVersion
    })
  }

  constructor({
    storage,
    key,
    migrators,
    currentDataVersion
  }: {
    storage: ObservableStorage | StorageInterface
    key: string
    migrators: Migrators
    currentDataVersion?: number
  }) {
    this.storage = storage
    this.key = key
    this.migrators = migrators
    this.currentDataVersion = currentDataVersion
  }

  async get(): Promise<S | null> {
    const data = await this.storage.get(this.key)
    if (!data) {
      return null
    }
    if (this.shouldMigrateData(data)) {
      return this.migrateData(data)
    }
    return data
  }

  private shouldMigrateData(data: any) {
    const comingDataVersion = getVersion(data?.dataVersion)
    const currentDataVersion = getVersion(this.currentDataVersion)
    return comingDataVersion < currentDataVersion
  }

  private migrateData(oldData: any): S {
    let migratedData = oldData
    for (const migrator of this.migrators) {
      if (this.isVersionMatch(migratedData, migrator)) {
        migratedData = migrator.migratorFunc(migratedData)
      }
      if (migratedData?.dataVersion === this.currentDataVersion) {
        break
      }
    }
    return migratedData
  }

  private isVersionMatch(oldData: any, migrator: Migrator) {
    return oldData?.dataVersion === migrator.oldDataVersion
  }

  async set(update: S): Promise<void> {
    return this.storage.set(this.key, update)
  }

  /**
   * Listen for changes to the stored data.
   * Note: Only works if the storage implementation supports change notifications.
   */
  async onChange(callback: (data: S) => void): Promise<Unsubscribe> {
    if ('onChange' in this.storage) {
      return this.storage.onChange(this.key, callback)
    }
    return () => {}
  }
}
