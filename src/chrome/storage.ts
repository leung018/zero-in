import { type Storage } from '../infra/storage'

export class ChromeStorageFactory {
  static createLocalStorage(): Storage {
    return chrome.storage.local
  }
}
