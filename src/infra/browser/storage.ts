import { type Storage } from '../storage'

export class BrowserStorageProvider {
  static getLocalStorage(): Storage {
    return browser.storage.local
  }
}
