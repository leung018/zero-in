import { expect, it } from 'vitest'
import { newFocusSessionRecord } from '.'
import { ObservableStorage } from '../../../infra/storage/interface'
import { FocusSessionRecordStorageService } from './storage'

export function runFocusSessionRecordStorageServiceTests(storage: ObservableStorage) {
  it('should return empty array if no FocusSessionRecords are saved', async () => {
    const service = new FocusSessionRecordStorageService(storage)
    expect(await service.getAll()).toStrictEqual([])
  })

  it('should save and get FocusSessionRecord', async () => {
    const service = new FocusSessionRecordStorageService(storage)
    const focusSessionRecords = [
      newFocusSessionRecord({
        completedAt: new Date('2021-01-01T00:10:00Z'),
        startedAt: new Date('2021-01-01T00:00:00Z')
      }),
      newFocusSessionRecord({ completedAt: new Date('2021-01-02'), startedAt: undefined }),
      newFocusSessionRecord({ completedAt: new Date('2021-01-03'), startedAt: undefined })
    ]

    await service.saveAll(focusSessionRecords)
    expect(await service.getAll()).toStrictEqual(focusSessionRecords)
  })
}
