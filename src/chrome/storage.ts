import { type Storage } from '../infra/storage'

export class ChromeStorageProvider {
  static getLocalStorage(): Storage {
    return chrome.storage.local
  }
}
