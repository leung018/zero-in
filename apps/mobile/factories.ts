import { getAuth, User } from '@react-native-firebase/auth'
import { TimerStage } from '../../packages/shared/src/domain/timer/stage'
import { AccountDeletionService } from './domain/account-deletion'
import { AppBlockTogglingService } from './domain/app-block-toggling'
import { newWeeklySchedulesStorageService } from './domain/schedules/storage'
import { newTimerBasedBlockingRulesStorageService } from './domain/timer-based-blocking/storage'
import { newTimerConfigStorageService } from './domain/timer/config/storage'
import { newFocusSessionRecordsStorageService } from './domain/timer/record/storage'
import { newTimerStateStorageService } from './domain/timer/state/storage'
import { FirebaseAccountAuth } from './infra/account/firebase-account-auth'
import {
  AppleSignInProvider,
  GoogleSignInProvider,
  SignInProvider
} from './infra/account/sign-in-provider'
import { FirebaseServices } from './infra/firebase/services'
import { appBlocker } from './modules/app-blocker'
import { createLogger } from './utils/logger'

const log = createLogger('Factories')

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
        log.info('Read timer state:', {
          stage: timerState?.stage,
          isRunning: timerState?.isRunning(),
          remainingMs: timerState?.remaining().totalMilliseconds
        })

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

export async function newAccountDeletionService(): Promise<AccountDeletionService> {
  const user = getAuth().currentUser
  if (!user) {
    throw new Error('User not authenticated')
  }

  return new AccountDeletionService({
    userId: user.uid,
    accountAuth: new FirebaseAccountAuth({ user, signInProvider: newSignInProvider(user) }),
    userStorages: await FirebaseServices.getAllFirestoreUserStorages(),
    deletionMarkerStorage: await FirebaseServices.getFirestoreDeletionMarkerStorage()
  })
}

function newSignInProvider(user: User): SignInProvider {
  const providerId = user.providerData[0]?.providerId

  switch (providerId) {
    case 'google.com':
      return new GoogleSignInProvider()
    case 'apple.com':
      return new AppleSignInProvider()
    default:
      throw new Error(`Unsupported sign-in provider: ${providerId}`)
  }
}
