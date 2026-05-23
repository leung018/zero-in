import { TimerStateStorageService } from '@zero-in/shared/domain/timer/state/storage'
import { PushNotifyingStorageProvider } from '../../../infra/storage/push-notifying'

export function newTimerStateStorageService(): TimerStateStorageService {
  return new TimerStateStorageService(PushNotifyingStorageProvider.create())
}
