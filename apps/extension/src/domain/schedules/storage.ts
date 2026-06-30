import { WeeklySchedulesStorageService } from '@zero-in/shared/domain/schedules/storage'
import { PushNotifyingStorageProvider } from '../../infra/storage/push-notifying'

export function newWeeklySchedulesStorageService(): WeeklySchedulesStorageService {
  return new WeeklySchedulesStorageService(PushNotifyingStorageProvider.create())
}
