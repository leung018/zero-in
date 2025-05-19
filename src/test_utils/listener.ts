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
import { CurrentDateService } from '../infra/current_date'
import { DesktopNotificationService } from '../infra/desktop_notification'
import { FakePeriodicTaskScheduler } from '../infra/scheduler'
import { BackgroundListener } from '../service_workers/listener'

export async function setUpListener({
  focusSessionRecordHouseKeepDays = 30,
  timerConfig = config.getDefaultTimerConfig(),
  currentDateService = CurrentDateService.createFake()
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
    timerStateStorageService: TimerStateStorageService.createFake(),
    timerConfigStorageService: TimerConfigStorageService.createFake(),
    closeTabsService: new FakeActionService(),
    focusSessionRecordStorageService: FocusSessionRecordStorageService.createFake()
  }

  const scheduler = new FakePeriodicTaskScheduler()
  await params.timerConfigStorageService.save(timerConfig)
  const timer = FocusTimer.createFake({
    scheduler
  })

  const listener = BackgroundListener.createFake({
    timer,
    focusSessionRecordHouseKeepDays,
    currentDateService,
    ...params
  })

  return {
    scheduler,
    timer,
    listener,
    ...params
  }
}
