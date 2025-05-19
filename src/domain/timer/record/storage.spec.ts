import { describe, expect, it } from 'vitest'
import { newFocusSessionRecord } from '.'
import { FocusSessionRecordStorageService } from './storage'
describe('FocusSessionRecordStorageService', () => {
  it('should return empty array if no FocusSessionRecords are saved', async () => {
    const focusSessionRecordStorageService = FocusSessionRecordStorageService.createFake()
    expect(await focusSessionRecordStorageService.getAll()).toStrictEqual([])
  })

  it('should save and get FocusSessionRecord', async () => {
    const focusSessionRecordStorageService = FocusSessionRecordStorageService.createFake()
    const focusSessionRecords = [
      newFocusSessionRecord(new Date('2021-01-01')),
      newFocusSessionRecord(new Date('2021-01-02'))
    ]

    await focusSessionRecordStorageService.saveAll(focusSessionRecords)
    expect(await focusSessionRecordStorageService.getAll()).toStrictEqual(focusSessionRecords)
  })
})
