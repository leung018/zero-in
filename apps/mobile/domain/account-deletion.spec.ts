import { FakeRemoteStorage } from '@zero-in/shared/infra/storage/fake'
import { RemoteStorage } from '@zero-in/shared/infra/storage/interface'
import { AccountDeletionService } from './account-deletion'

describe('AccountDeletionService', () => {
  it('should delete every key in every user storage', async () => {
    const appStorage = await createStorageWithKeys(['timerState', 'weeklySchedules'])
    const tokenStorage = await createStorageWithKeys(['device-1'])
    const { service } = setup({ userStorages: [appStorage, tokenStorage] })

    await service.deleteAccount()

    expect(await appStorage.getKeys()).toEqual([])
    expect(await tokenStorage.getKeys()).toEqual([])
  })
})

function setup({
  userStorages = [FakeRemoteStorage.create()]
}: {
  userStorages?: RemoteStorage[]
} = {}) {
  const service = AccountDeletionService.createFake({ userStorages })
  return { service }
}

async function createStorageWithKeys(keys: string[]): Promise<FakeRemoteStorage> {
  const storage = FakeRemoteStorage.create()
  for (const key of keys) {
    await storage.set(key, { value: key })
  }
  return storage
}
