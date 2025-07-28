import { beforeEach, describe, expect, it } from 'vitest'
import { FocusSessionRecord } from '.'
import { LocalStorageWrapper } from '../../../infra/storage/local_storage_wrapper'
import { FocusSessionRecordsSchemas } from './schema'
import { FocusSessionRecordStorageService } from './storage'
import { runFocusSessionRecordStorageServiceTests } from './storage_test'

describe('FocusSessionRecordStorageService', () => {
  let storage = LocalStorageWrapper.createFake()

  beforeEach(() => {
    storage = LocalStorageWrapper.createFake()
  })

  runFocusSessionRecordStorageServiceTests(storage)

  it('should migrate properly', async () => {
    const data: FocusSessionRecordsSchemas[0] = [
      { completedAt: '2023-01-01T00:00:00Z' },
      { completedAt: '2023-01-02T00:00:00Z' }
    ]
    storage.set(FocusSessionRecordStorageService.STORAGE_KEY, data)

    const service = new FocusSessionRecordStorageService(storage)
    const expected: FocusSessionRecord[] = [
      { completedAt: new Date('2023-01-01T00:00:00Z') },
      { completedAt: new Date('2023-01-02T00:00:00Z') }
    ]
    const actual = await service.getAll()
    expect(actual).toEqual(expected)
  })
})
