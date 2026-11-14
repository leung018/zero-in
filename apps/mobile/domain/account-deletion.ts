import { FakeRemoteStorage } from '@zero-in/shared/infra/storage/fake'
import { RemoteStorage } from '@zero-in/shared/infra/storage/interface'

type AccountDeletionDeps = {
  userStorages: RemoteStorage[]
}

export class AccountDeletionService {
  static createFake(overrides: Partial<AccountDeletionDeps> = {}): AccountDeletionService {
    return new AccountDeletionService({
      userStorages: [FakeRemoteStorage.create()],
      ...overrides
    })
  }

  constructor(private readonly deps: AccountDeletionDeps) {}

  async deleteAccount(): Promise<void> {
    for (const storage of this.deps.userStorages) {
      for (const key of await storage.getKeys()) {
        await storage.delete(key)
      }
    }
  }
}
