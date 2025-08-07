import { expect, it } from 'vitest'
import { newFocusSessionRecord } from '.'
import { StorageInterface } from '../../../infra/storage/interface'
import { FocusSessionRecordStorageService } from './storage'

export function runFocusSessionRecordStorageServiceTests(storage: StorageInterface) {
  it('should return empty array if no FocusSessionRecords are saved', async () => {
    const service = new FocusSessionRecordStorageService(storage)
    expect(await service.getAll()).toStrictEqual([])
  })

  it('should save and get FocusSessionRecord', async () => {
    const service = new FocusSessionRecordStorageService(storage)
    const focusSessionRecords = [
      newFocusSessionRecord({ completedAt: new Date('2021-01-01') }),
      newFocusSessionRecord({ completedAt: new Date('2021-01-02') })
    ]

    await service.saveAll(focusSessionRecords)
    expect(await service.getAll()).toStrictEqual(focusSessionRecords)
  })
}
