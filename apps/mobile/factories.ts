import { Duration } from '../../packages/shared/src/domain/timer/duration'
import { TimerStage } from '../../packages/shared/src/domain/timer/stage'
import { AppBlockTogglingService } from './domain/app-block-toggling'
import { newWeeklySchedulesStorageService } from './domain/schedules/storage'
import { newTimerBasedBlockingRulesStorageService } from './domain/timer-based-blocking/storage'
import { newFocusSessionRecordsStorageService } from './domain/timer/record/storage'
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
    focusSessionRecordsStorageService: newFocusSessionRecordsStorageService(),
    timerBasedBlockingRulesStorageService: newTimerBasedBlockingRulesStorageService(),
    timerInfoGetter: {
      getTimerInfo: async () => {
        // TODO: Implement real timer info retrieval logic
        return {
          timerStage: TimerStage.FOCUS,
          isRunning: false,
          remaining: new Duration({}),
          longBreak: new Duration({}),
          shortBreak: new Duration({})
        }
      }
    },
    appBlocker
  })
}
