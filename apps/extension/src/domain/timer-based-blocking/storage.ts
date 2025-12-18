import { TimerBasedBlockingRulesStorageService } from '@zero-in/shared/domain/timer-based-blocking/storage'
import { AdaptiveStorageProvider } from '../../infra/storage/adaptive'

export function newTimerBasedBlockingRulesStorageService(): TimerBasedBlockingRulesStorageService {
  return new TimerBasedBlockingRulesStorageService(AdaptiveStorageProvider.create())
}
