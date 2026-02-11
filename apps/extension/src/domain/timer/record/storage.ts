import { FocusSessionRecordsStorageService } from '@zero-in/shared/domain/timer/record/storage'
import { AdaptiveStorageProvider } from '../../../infra/storage/adaptive'

export function newFocusSessionRecordsStorageService(): FocusSessionRecordsStorageService {
  return new FocusSessionRecordsStorageService(AdaptiveStorageProvider.create())
}
