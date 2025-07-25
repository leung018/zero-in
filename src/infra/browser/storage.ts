import { type LocalStorage } from '../storage/local_storage'

export class BrowserStorageProvider {
  static getLocalStorage(): LocalStorage {
    return browser.storage.local
  }
}
