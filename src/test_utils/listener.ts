import config from '../config'
import { FocusTimer } from '../domain/pomodoro/timer'
import { FakeActionService } from '../infra/action'
import { FakeBadgeDisplayService } from '../infra/badge'
import { FakeCommunicationManager } from '../infra/communication'
import { FakePeriodicTaskScheduler } from '../infra/scheduler'
import { BackgroundListener } from '../service_workers/listener'
import { TimerStateStorageService } from '../domain/pomodoro/state/storage'
import { FocusSessionRecordStorageService } from '../domain/pomodoro/record/storage'
import { TimerConfigStorageService } from '../domain/pomodoro/config/storage'
import { WeeklyScheduleStorageService } from '../domain/schedules/storage'
import { BrowsingRulesStorageService } from '../domain/browsing_rules/storage'
import { FakeBrowsingControlService } from '../infra/browsing_control'
import { CurrentDateService } from '../infra/current_date'
import { NotificationSettingStorageService } from '../domain/notification_setting/storage'
import { BlockingTimerIntegrationStorageService } from '../domain/blocking_timer_integration/storage'
import { DesktopNotificationService } from '../infra/desktop_notification'

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
