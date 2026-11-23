import { FakeAccountAuth, ReauthResult } from '@/infra/account/interface'
import { AppBlocker, FakeAppBlocker } from '@/infra/app-block/app-blocker'
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

  it('should return deleted when the account is deleted', async () => {
    const { service } = setup()

    expect(await service.deleteAccount()).toBe('deleted')
  })

  it('should return cancelled when reauthentication is cancelled', async () => {
    const { service } = setup({ reauthResult: 'cancelled' })

    expect(await service.deleteAccount()).toBe('cancelled')
  })

  it('should not change anything when reauthentication is cancelled', async () => {
    const userStorage = await createStorageWithKeys(['timerState'])
    const deletionMarkerStorage = FakeRemoteStorage.create()
    const { service, accountAuth } = setup({
      reauthResult: 'cancelled',
      userStorages: [userStorage],
      deletionMarkerStorage
    })

    await service.deleteAccount()

    expect(accountAuth.isUserDeleted()).toBe(false)
    expect(await userStorage.getKeys()).toEqual(['timerState'])
    expect(await deletionMarkerStorage.getKeys()).toEqual([])
  })

  it('should delete every key in every user storage', async () => {
    const appStorage = await createStorageWithKeys(['timerState', 'weeklySchedules'])
    const tokenStorage = await createStorageWithKeys(['device-1'])
    const { service } = setup({ userStorages: [appStorage, tokenStorage] })

    await service.deleteAccount()

    expect(await appStorage.getKeys()).toEqual([])
    expect(await tokenStorage.getKeys()).toEqual([])
  })

  it('should stop all blocking', async () => {
    const appBlocker = await createBlockingAppBlocker()
    const { service } = setup({ appBlocker })

    await service.deleteAccount()

    expect(appBlocker.getBlockingState()).toEqual({ kind: 'none' })
  })
})

function setup({
  userId = 'user-1',
  reauthResult = 'reauthenticated',
  userStorages = [FakeRemoteStorage.create()],
  deletionMarkerStorage = FakeRemoteStorage.create(),
  appBlocker = AppBlocker.createFake()
}: {
  userId?: string
  reauthResult?: ReauthResult
  userStorages?: RemoteStorage[]
  deletionMarkerStorage?: RemoteStorage
  appBlocker?: FakeAppBlocker
} = {}) {
  const accountAuth = new FakeAccountAuth({ reauthResult })
  const service = AccountDeletionService.createFake({
    userId,
    accountAuth,
    userStorages,
    deletionMarkerStorage,
    appBlocker
  })
  return { service, accountAuth }
}

async function createBlockingAppBlocker(): Promise<FakeAppBlocker> {
  const appBlocker = AppBlocker.createFake()
  await appBlocker.enableAlwaysBlock()
  return appBlocker
}

async function createStorageWithKeys(keys: string[]): Promise<FakeRemoteStorage> {
  const storage = FakeRemoteStorage.create()
  for (const key of keys) {
    await storage.set(key, { value: key })
  }
  return storage
}
