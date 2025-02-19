import { type StorageHandler } from '../infra/storage'

export class ChromeLocalStorageFactory {
  static createStorageHandler(): StorageHandler {
    return chrome.storage.local
  }
}
