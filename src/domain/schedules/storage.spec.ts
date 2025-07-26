import { beforeEach, describe } from 'vitest'
import { LocalStorageWrapper } from '../../infra/storage/local_storage_wrapper'
import { runWeeklyScheduleStorageServiceTests } from './storage_test'

describe('WeeklyScheduleStorageService', () => {
  let storage = LocalStorageWrapper.createFake()

  beforeEach(() => {
    storage = LocalStorageWrapper.createFake()
  })

  runWeeklyScheduleStorageServiceTests(storage)
})
