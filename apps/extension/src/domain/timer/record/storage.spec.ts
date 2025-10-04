import { beforeEach, describe, expect, it } from 'vitest'
import { FocusSessionRecord, newFocusSessionRecord } from '.'
import { LocalStorageWrapper } from '../../../infra/storage/local-storage'
import { FocusSessionRecordsSchemas } from './schema'
import { FocusSessionRecordsStorageService } from './storage'
import { runFocusSessionRecordsStorageServiceTests } from './storage-shared-spec'

describe('FocusSessionRecordsStorageService', () => {
  let storage = LocalStorageWrapper.createFake()

  beforeEach(() => {
    storage = LocalStorageWrapper.createFake()
  })

  runFocusSessionRecordsStorageServiceTests(storage)

  it('should migrate properly', async () => {
    const data: FocusSessionRecordsSchemas[0] = [
      { completedAt: '2023-01-01T00:00:00Z' },
      { completedAt: '2023-01-02T00:00:00Z' }
    ]
    storage.set(FocusSessionRecordsStorageService.STORAGE_KEY, data)

    const service = new FocusSessionRecordsStorageService(storage)
    const expected: FocusSessionRecord[] = [
      { startedAt: undefined, completedAt: new Date('2023-01-01T00:00:00Z') },
      { startedAt: undefined, completedAt: new Date('2023-01-02T00:00:00Z') }
    ]
    const actual = await service.get()
    expect(actual).toEqual(expected)
  })

  it('should deduplicate records with the same startedAt timestamp', async () => {
    const service = new FocusSessionRecordsStorageService(storage)
    const record = newFocusSessionRecord({
      completedAt: new Date('2021-01-01T00:10:00Z'),
      startedAt: new Date('2021-01-01T00:00:00Z')
    })
    const focusSessionRecords = [
      record,
      newFocusSessionRecord({
        completedAt: new Date('2021-01-01T00:10:01Z)'),
        startedAt: new Date('2021-01-01T00:00:00Z')
      })
    ]
    await service.save(focusSessionRecords)
    expect(await service.get()).toStrictEqual([record])
  })
})
