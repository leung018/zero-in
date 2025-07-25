export interface LocalStorage {
  set(obj: any): Promise<void>
  get(key: string): Promise<any>
}

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

interface Schema {
  dataVersion: number
}

type MigratorFunc = (oldData: any) => Schema

type Migrator = { oldDataVersion?: number; migratorFunc: MigratorFunc }

type Migrators = ReadonlyArray<Migrator>

export class StorageManager<S> {
  private storage: LocalStorage
  private key: string
  private migrators: Migrators
  private currentDataVersion?: number

  static createFake<S>({
    storage = new FakeLocalStorage(),
    migrators = [] as Migrators,
    key = 'STORAGE_KEY',
    currentDataVersion = undefined as number | undefined
  }): StorageManager<S> {
    return new StorageManager({ storage, key, migrators, currentDataVersion })
  }

  constructor({
    storage,
    key,
    migrators,
    currentDataVersion
  }: {
    storage: LocalStorage
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
    const result = await this.storage.get(this.key)
    const data = result[this.key]
    if (!data) {
      return null
    }

    if (data?.dataVersion === this.currentDataVersion) {
      return data
    }

    return this.migrateData(data)
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
    return this.storage.set({ [this.key]: update })
  }
}
