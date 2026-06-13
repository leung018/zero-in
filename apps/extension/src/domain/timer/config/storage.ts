import { TimerConfigStorageService } from '@zero-in/shared/domain/timer/config/storage'
import { AdaptiveAppStorageProvider } from '../../../infra/storage/adaptive'

export function newTimerConfigStorageService() {
  return new TimerConfigStorageService(AdaptiveAppStorageProvider.create())
}
