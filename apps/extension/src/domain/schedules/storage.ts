import { WeeklySchedulesStorageService } from '@zero-in/shared/domain/schedules/storage'
import { AdaptiveStorageProvider } from '../../infra/storage/adaptive'

export function newWeeklySchedulesStorageService(): WeeklySchedulesStorageService {
  return new WeeklySchedulesStorageService(AdaptiveStorageProvider.create())
}
