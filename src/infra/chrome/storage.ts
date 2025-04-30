import { type Storage } from '../storage'

export class ChromeStorageProvider {
  static getLocalStorage(): Storage {
    return chrome.storage.local
  }
}
