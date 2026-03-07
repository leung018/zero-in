import { TimerStateStorageService } from '@zero-in/shared/domain/timer/state/storage'
import { AdaptiveStorageProvider } from '../../../infra/storage/adaptive'

export function newTimerStateStorageService(): TimerStateStorageService {
  return new TimerStateStorageService(AdaptiveStorageProvider.create())
}
