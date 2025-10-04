import { StorageInterface, StorageService } from '../../infra/storage/interface'
import { SettingsStorageKey, newSettingStorageServicesMap } from '../../infra/storage/key'
import { LocalStorageWrapper } from '../../infra/storage/local-storage'

export class ImportService {
  private localStorageServicesMap: ReturnType<typeof newSettingStorageServicesMap>
  private remoteStorageServicesMap: ReturnType<typeof newSettingStorageServicesMap>

  static createFake({
    localStorage = LocalStorageWrapper.createFake(),
    remoteStorage = LocalStorageWrapper.createFake()
  }) {
    return new ImportService({
      localStorage,
      remoteStorage
    })
  }

  constructor({
    localStorage,
    remoteStorage
  }: {
    localStorage: StorageInterface
    remoteStorage: StorageInterface
  }) {
    this.localStorageServicesMap = newSettingStorageServicesMap(localStorage)
    this.remoteStorageServicesMap = newSettingStorageServicesMap(remoteStorage)
  }

  async importFromLocalToRemote() {
    const importPromises = []

    for (const storageKey of Object.values(SettingsStorageKey)) {
      const remoteStorageService = this.remoteStorageServicesMap[storageKey]
      const localStorageService = this.localStorageServicesMap[storageKey]
      importPromises.push(this.import(localStorageService, remoteStorageService))
    }

    await Promise.all(importPromises)
  }

  private async import<T>(
    sourceStorageService: StorageService<T>,
    targetStorageService: StorageService<T>
  ) {
    const result = await sourceStorageService.get()
    if (result) {
      await targetStorageService.save(result)
    }
  }
}
