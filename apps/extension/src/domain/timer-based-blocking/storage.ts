import { TimerBasedBlockingRulesStorageService } from '@zero-in/shared/domain/timer-based-blocking/storage'
import { PushNotifyingStorageProvider } from '../../infra/storage/push-notifying'

export function newTimerBasedBlockingRulesStorageService(): TimerBasedBlockingRulesStorageService {
  return new TimerBasedBlockingRulesStorageService(PushNotifyingStorageProvider.create())
}
