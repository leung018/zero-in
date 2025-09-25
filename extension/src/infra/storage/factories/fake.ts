import { WeeklySchedulesStorageService } from '../../../../../shared/src/domain/schedules/storage'
import { BrowsingRulesStorageService } from '../../../domain/browsing_rules/storage'
import { DailyResetTimeStorageService } from '../../../domain/daily_reset_time/storage'
import { ImportRecordStorageService } from '../../../domain/import/record/storage'
import { NotificationSettingStorageService } from '../../../domain/notification_setting/storage'
import { TimerConfigStorageService } from '../../../domain/timer/config/storage'
import { FocusSessionRecordsStorageService } from '../../../domain/timer/record/storage'
import { TimerStateStorageService } from '../../../domain/timer/state/storage'
import { TimerBasedBlockingRulesStorageService } from '../../../domain/timer_based_blocking/storage'
import { LocalStorageWrapper } from '../local_storage'

export function fakeNotificationSettingStorageService() {
  return new NotificationSettingStorageService(LocalStorageWrapper.createFake())
}

export function fakeTimerStateStorageService() {
  return new TimerStateStorageService(LocalStorageWrapper.createFake())
}

export function fakeTimerConfigStorageService() {
  return new TimerConfigStorageService(LocalStorageWrapper.createFake())
}

export function fakeFocusSessionRecordsStorageService() {
  return new FocusSessionRecordsStorageService(LocalStorageWrapper.createFake())
}

export function fakeWeeklySchedulesStorageService() {
  return new WeeklySchedulesStorageService(LocalStorageWrapper.createFake())
}

export function fakeDailyResetTimeStorageService() {
  return new DailyResetTimeStorageService(LocalStorageWrapper.createFake())
}

export function fakeBrowsingRulesStorageService() {
  return new BrowsingRulesStorageService(LocalStorageWrapper.createFake())
}

export function fakeTimerBasedBlockingRulesStorageService() {
  return new TimerBasedBlockingRulesStorageService(LocalStorageWrapper.createFake())
}

export function fakeImportRecordStorageService() {
  return new ImportRecordStorageService(LocalStorageWrapper.createFake())
}
