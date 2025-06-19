import { type Storage } from '../storage'

export class ChromeStorageProvider {
  static getLocalStorage(): Storage {
    return browser.storage.local
  }
}
