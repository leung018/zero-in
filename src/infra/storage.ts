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

interface Schema {
  dataVersion: number
}

type MigratorFunc = (oldData: any) => Schema

type Migrator = { oldDataVersion?: number; migratorFunc: MigratorFunc }

type Migrators = ReadonlyArray<Migrator>

export class StorageWrapper<S> {
  private storage: Storage
  private key: string
  private migrators: Migrators
  private currentDataVersion?: number

  static createFake<S>({
    storage = new FakeStorage(),
    migrators = [] as Migrators,
    key = 'STORAGE_KEY',
    currentDataVersion = 0
  }): StorageWrapper<S> {
    return new StorageWrapper({ storage, key, migrators, currentDataVersion })
  }

  constructor({
    storage,
    key,
    migrators,
    currentDataVersion
  }: {
    storage: Storage
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
    if (!result[this.key]) {
      return null
    }

    const data = result[this.key]
    if (data?.dataVersion != this.currentDataVersion) {
      return this.migrateData(data)
    }
    return data
  }

  private migrateData(oldData: any): S {
    let migratedData = oldData
    for (const migrator of this.migrators) {
      if (this.isVersionMatch(migratedData, migrator)) {
        migratedData = migrator.migratorFunc(migratedData)
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
