import { TimerConfigStorageService } from '@zero-in/shared/domain/timer/config/storage'
import { AdaptiveStorageProvider } from '../../../infra/storage/adaptive'

export function newTimerConfigStorageService() {
  return new TimerConfigStorageService(AdaptiveStorageProvider.create())
}
