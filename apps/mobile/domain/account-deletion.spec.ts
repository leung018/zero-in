import { FakeAccountAuth } from '@/infra/account/interface'
import { FakeRemoteStorage } from '@zero-in/shared/infra/storage/fake'
import { RemoteStorage } from '@zero-in/shared/infra/storage/interface'
import { AccountDeletionService } from './account-deletion'

describe('AccountDeletionService', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should write a deletion marker with the deletion time under the user id', async () => {
    jest.setSystemTime(new Date('2026-01-05T08:00:00'))
    const deletionMarkerStorage = FakeRemoteStorage.create()
    const { service } = setup({ userId: 'user-1', deletionMarkerStorage })

    await service.deleteAccount()

    expect(await deletionMarkerStorage.get('user-1')).toEqual({
      deletedAt: new Date('2026-01-05T08:00:00').getTime()
    })
  })

  it('should delete the user', async () => {
    const { service, accountAuth } = setup()

    await service.deleteAccount()

    expect(accountAuth.isUserDeleted()).toBe(true)
  })

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
  userId = 'user-1',
  userStorages = [FakeRemoteStorage.create()],
  deletionMarkerStorage = FakeRemoteStorage.create()
}: {
  userId?: string
  userStorages?: RemoteStorage[]
  deletionMarkerStorage?: RemoteStorage
} = {}) {
  const accountAuth = new FakeAccountAuth()
  const service = AccountDeletionService.createFake({
    userId,
    accountAuth,
    userStorages,
    deletionMarkerStorage
  })
  return { service, accountAuth }
}

async function createStorageWithKeys(keys: string[]): Promise<FakeRemoteStorage> {
  const storage = FakeRemoteStorage.create()
  for (const key of keys) {
    await storage.set(key, { value: key })
  }
  return storage
}
