import { LocalStorageWrapper } from '@zero-in/shared/infra/storage/local-storage/index'

export function newLocalStorage(): LocalStorageWrapper {
  return new LocalStorageWrapper(browser.storage.local)
}
