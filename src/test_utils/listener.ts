import config from '../config'
import { BlockingTimerIntegrationStorageService } from '../domain/blocking_timer_integration/storage'
import { BrowsingRulesStorageService } from '../domain/browsing_rules/storage'
import { NotificationSettingStorageService } from '../domain/notification_setting/storage'
import { WeeklySchedulesStorageService } from '../domain/schedules/storage'
import { FocusTimer } from '../domain/timer'
import { TimerConfigStorageService } from '../domain/timer/config/storage'
import { FocusSessionRecordStorageService } from '../domain/timer/record/storage'
import { TimerStateStorageService } from '../domain/timer/state/storage'
import { FakeActionService } from '../infra/action'
import { FakeBadgeDisplayService } from '../infra/badge'
import { FakeBrowsingControlService } from '../infra/browsing_control'
import { FakeCommunicationManager } from '../infra/communication'
import { DesktopNotificationService } from '../infra/desktop_notification'
import { LocalStorageWrapper } from '../infra/storage/local_storage'
import { BackgroundListener } from '../service_workers/listener'

export async function setUpListener({
  focusSessionRecordHouseKeepDays = 30,
  timerConfig = config.getDefaultTimerConfig(),
  timerStateStorageService = TimerStateStorageService.createFake(),
  timerConfigStorageService = TimerConfigStorageService.createFake()
} = {}) {
  const storage = LocalStorageWrapper.createFake()

  const params = {
    notificationSettingStorageService: new NotificationSettingStorageService(storage),
    blockingTimerIntegrationStorageService: new BlockingTimerIntegrationStorageService(storage),
    browsingControlService: new FakeBrowsingControlService(),
    weeklySchedulesStorageService: new WeeklySchedulesStorageService(storage),
    browsingRulesStorageService: new BrowsingRulesStorageService(storage),
    desktopNotificationService: DesktopNotificationService.createFake(),
    reminderTabService: new FakeActionService(),
    soundService: new FakeActionService(),
    badgeDisplayService: new FakeBadgeDisplayService(),
    communicationManager: new FakeCommunicationManager(),
    timerStateStorageService,
    timerConfigStorageService,
    closeTabsService: new FakeActionService(),
    focusSessionRecordStorageService: new FocusSessionRecordStorageService(storage)
  }

  await params.timerConfigStorageService.save(timerConfig)
  const timer = FocusTimer.create()

  const listener = BackgroundListener.createFake({
    timer,
    focusSessionRecordHouseKeepDays,
    ...params
  })

  return {
    storage,
    timer,
    listener,
    ...params
  }
}
