import { LocalStorageWrapper } from '../storage/local_storage/'

export class LocalStorageUserIdCache {
  private static KEY = 'authenticatedUserId'
  private static _localStorageWrapper: LocalStorageWrapper | null = null

  static get localStorageWrapper() {
    if (!this._localStorageWrapper) {
      this._localStorageWrapper = LocalStorageWrapper.create()
    }
    return this._localStorageWrapper
  }

  static async get(): Promise<{
    userId: string | null
    isCacheSet: boolean
  }> {
    const userId = await this.localStorageWrapper.get(this.KEY)
    return {
      userId: userId ? userId : null,
      isCacheSet: userId !== undefined
    }
  }

  static async setSignInUser(userId: string) {
    await this.localStorageWrapper.set(this.KEY, userId)
  }

  static async setSignOut() {
    await this.localStorageWrapper.set(this.KEY, '')
  }
}
