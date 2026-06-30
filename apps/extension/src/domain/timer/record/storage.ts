import { FocusSessionRecordsStorageService } from '@zero-in/shared/domain/timer/record/storage'
import { AdaptiveAppStorageProvider } from '../../../infra/storage/adaptive'

export function newFocusSessionRecordsStorageService(): FocusSessionRecordsStorageService {
  return new FocusSessionRecordsStorageService(AdaptiveAppStorageProvider.create())
}
