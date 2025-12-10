import { StorageInterface } from '@zero-in/shared/infra/storage/interface'
import { expect, it } from 'vitest'
import { newFocusSessionRecord } from '.'
import { FocusSessionRecordsStorageService } from './storage'

export function runFocusSessionRecordsStorageServiceTests(storage: StorageInterface) {
  it('should return empty array if no FocusSessionRecords are saved', async () => {
    const service = new FocusSessionRecordsStorageService(storage)
    expect(await service.get()).toStrictEqual([])
  })

  it('should save and get FocusSessionRecord', async () => {
    const service = new FocusSessionRecordsStorageService(storage)
    const focusSessionRecords = [
      newFocusSessionRecord({
        completedAt: new Date('2021-01-01T00:10:00Z'),
        startedAt: new Date('2021-01-01T00:00:00Z')
      }),
      newFocusSessionRecord({ completedAt: new Date('2021-01-02'), startedAt: undefined }),
      newFocusSessionRecord({ completedAt: new Date('2021-01-03'), startedAt: undefined })
    ]

    await service.save(focusSessionRecords)
    expect(await service.get()).toStrictEqual(focusSessionRecords)
  })
}
