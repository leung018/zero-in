import { runWeeklyScheduleStorageServiceTests } from '@zero-in/shared/domain/schedules/storage-shared-spec'
import { LocalStorageWrapper } from '@zero-in/shared/infra/storage/local-storage/index'

describe('WeeklyScheduleStorageService', () => {
  let storage = LocalStorageWrapper.createFake()

  beforeEach(() => {
    storage = LocalStorageWrapper.createFake()
  })

  runWeeklyScheduleStorageServiceTests(storage) // Just for verifying that jest can run the shared test suite
})
