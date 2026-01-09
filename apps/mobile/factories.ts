import { AppBlockTogglingService } from './domain/app-block-toggling'
import { newWeeklySchedulesStorageService } from './domain/schedules/storage'
import { appBlocker } from './modules/app-blocker'

/**
 * This file contains factory methods for services that depend on real native modules.
 *
 * We use standalone factory functions instead of static `.create()` methods on the service
 * classes to isolate native dependencies. This prevents domain logic files from importing
 * native modules, allowing them to be unit-tested without errors in non-native environments.
 */

export function newAppBlockTogglingService() {
  return new AppBlockTogglingService({
    weeklySchedulesStorageService: newWeeklySchedulesStorageService(),
    appBlocker
  })
}
