import { FakeRemoteStorage } from '@zero-in/shared/infra/storage/fake'
import { RemoteStorage } from '@zero-in/shared/infra/storage/interface'
import { AccountAuth, FakeAccountAuth } from '../infra/account/interface'

export type AccountDeletionResult = 'deleted' | 'cancelled'

type AccountDeletionDeps = {
  userId: string
  accountAuth: AccountAuth
  userStorages: RemoteStorage[]
  deletionMarkerStorage: RemoteStorage
}

export class AccountDeletionService {
  static createFake(overrides: Partial<AccountDeletionDeps> = {}): AccountDeletionService {
    return new AccountDeletionService({
      userId: 'user-1',
      accountAuth: new FakeAccountAuth(),
      userStorages: [FakeRemoteStorage.create()],
      deletionMarkerStorage: FakeRemoteStorage.create(),
      ...overrides
    })
  }

  constructor(private readonly deps: AccountDeletionDeps) {}

  async deleteAccount(): Promise<AccountDeletionResult> {
    if ((await this.deps.accountAuth.reauthenticate()) === 'cancelled') return 'cancelled'

    // Write the marker before deleting data: Firestore rules then reject writes from other
    // clients still signed in as this user (e.g. the extension), so they can't recreate data
    // that would be left behind after the user is deleted.
    await this.deps.deletionMarkerStorage.set(this.deps.userId, { deletedAt: Date.now() })

    for (const storage of this.deps.userStorages) {
      for (const key of await storage.getKeys()) {
        await storage.delete(key)
      }
    }

    await this.deps.accountAuth.deleteUser()
    return 'deleted'
  }
}
