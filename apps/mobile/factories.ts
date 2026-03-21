import { TimerStage } from '../../packages/shared/src/domain/timer/stage'
import { AppBlockTogglingService } from './domain/app-block-toggling'
import { newWeeklySchedulesStorageService } from './domain/schedules/storage'
import { newTimerBasedBlockingRulesStorageService } from './domain/timer-based-blocking/storage'
import { newTimerConfigStorageService } from './domain/timer/config/storage'
import { newFocusSessionRecordsStorageService } from './domain/timer/record/storage'
import { newTimerStateStorageService } from './domain/timer/state/storage'
import { appBlocker } from './modules/app-blocker'

/**
 * This file contains factory methods for services that depend on real native modules.
 *
 * We use standalone factory functions instead of static `.create()` methods on the service
 * classes to isolate native dependencies. This prevents domain logic files from importing
 * native modules, allowing them to be unit-tested without errors in non-native environments.
 */

export function newAppBlockTogglingService() {
  const timerStateStorageService = newTimerStateStorageService()
  const timerConfigStorageService = newTimerConfigStorageService()

  return new AppBlockTogglingService({
    weeklySchedulesStorageService: newWeeklySchedulesStorageService(),
    focusSessionRecordsStorageService: newFocusSessionRecordsStorageService(),
    timerBasedBlockingRulesStorageService: newTimerBasedBlockingRulesStorageService(),
    timerInfoGetter: {
      // Below is workaround when mobile app don't have its own timer
      getTimerInfo: async () => {
        const timerState = await timerStateStorageService.get()
        const timerConfig = await timerConfigStorageService.get()

        return {
          timerStage: timerState?.stage || TimerStage.FOCUS,
          isRunning: timerState?.isRunning() ?? false,
          remaining: timerState?.remaining() ?? timerConfig.focusDuration,
          longBreak: timerConfig.longBreakDuration,
          shortBreak: timerConfig.shortBreakDuration
        }
      }
    },
    appBlocker
  })
}
