import config from '../config'
import { BlockingTimerIntegrationStorageService } from '../domain/blocking_timer_integration/storage'
import { BrowsingRulesStorageService } from '../domain/browsing_rules/storage'
import { NotificationSettingStorageService } from '../domain/notification_setting/storage'
import { WeeklyScheduleStorageService } from '../domain/schedules/storage'
import { FocusTimer } from '../domain/timer'
import { TimerConfigStorageService } from '../domain/timer/config/storage'
import { FocusSessionRecordStorageService } from '../domain/timer/record/storage'
import { TimerStateStorageService } from '../domain/timer/state/storage'
import { FakeActionService } from '../infra/action'
import { FakeBadgeDisplayService } from '../infra/badge'
import { FakeBrowsingControlService } from '../infra/browsing_control'
import { FakeCommunicationManager } from '../infra/communication'
import { DesktopNotificationService } from '../infra/desktop_notification'
import { BackgroundListener } from '../service_workers/listener'

export async function setUpListener({
  focusSessionRecordHouseKeepDays = 30,
  timerConfig = config.getDefaultTimerConfig(),
  timerStateStorageService = TimerStateStorageService.createFake(),
  timerConfigStorageService = TimerConfigStorageService.createFake()
} = {}) {
  const params = {
    notificationSettingStorageService: NotificationSettingStorageService.createFake(),
    blockingTimerIntegrationStorageService: BlockingTimerIntegrationStorageService.createFake(),
    browsingControlService: new FakeBrowsingControlService(),
    weeklyScheduleStorageService: WeeklyScheduleStorageService.createFake(),
    browsingRulesStorageService: BrowsingRulesStorageService.createFake(),
    desktopNotificationService: DesktopNotificationService.createFake(),
    reminderTabService: new FakeActionService(),
    soundService: new FakeActionService(),
    badgeDisplayService: new FakeBadgeDisplayService(),
    communicationManager: new FakeCommunicationManager(),
    timerStateStorageService,
    timerConfigStorageService,
    closeTabsService: new FakeActionService(),
    focusSessionRecordStorageService: FocusSessionRecordStorageService.createFake()
  }

  await params.timerConfigStorageService.save(timerConfig)
  const timer = FocusTimer.create()

  const listener = BackgroundListener.createFake({
    timer,
    focusSessionRecordHouseKeepDays,
    ...params
  })

  return {
    timer,
    listener,
    ...params
  }
}
