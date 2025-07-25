import { type LocalStorage } from '../storage'

export class BrowserStorageProvider {
  static getLocalStorage(): LocalStorage {
    return browser.storage.local
  }
}
