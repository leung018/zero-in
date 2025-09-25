import { WeeklySchedulesStorageService } from '../../../../../shared/src/domain/schedules/storage'
import { BrowsingRulesStorageService } from '../../../domain/browsing_rules/storage'
import { DailyResetTimeStorageService } from '../../../domain/daily_reset_time/storage'
import { ImportRecordStorageService } from '../../../domain/import/record/storage'
import { NotificationSettingStorageService } from '../../../domain/notification_setting/storage'
import { TimerConfigStorageService } from '../../../domain/timer/config/storage'
import { FocusSessionRecordsStorageService } from '../../../domain/timer/record/storage'
import { TimerStateStorageService } from '../../../domain/timer/state/storage'
import { TimerBasedBlockingRulesStorageService } from '../../../domain/timer_based_blocking/storage'
import { AdaptiveStorageProvider } from '../adaptive'
import { FirestoreStorageWrapper } from '../firestore'

export function realNotificationSettingStorageService() {
  return new NotificationSettingStorageService(AdaptiveStorageProvider.create())
}

export function realTimerStateStorageService() {
  return new TimerStateStorageService(AdaptiveStorageProvider.create())
}

export function realTimerConfigStorageService() {
  return new TimerConfigStorageService(AdaptiveStorageProvider.create())
}

export function realFocusSessionRecordsStorageService() {
  return new FocusSessionRecordsStorageService(AdaptiveStorageProvider.create())
}

export function realWeeklySchedulesStorageService() {
  return new WeeklySchedulesStorageService(AdaptiveStorageProvider.create())
}

export function realDailyResetTimeStorageService() {
  return new DailyResetTimeStorageService(AdaptiveStorageProvider.create())
}

export function realBrowsingRulesStorageService() {
  return new BrowsingRulesStorageService(AdaptiveStorageProvider.create())
}

export function realTimerBasedBlockingRulesStorageService() {
  return new TimerBasedBlockingRulesStorageService(AdaptiveStorageProvider.create())
}

export function realImportRecordStorageService() {
  return new ImportRecordStorageService(FirestoreStorageWrapper.create())
}
