import config from '../config'
import { PomodoroTimer } from '../domain/pomodoro/timer'
import { FakeActionService } from '../infra/action'
import { FakeBadgeDisplayService } from '../infra/badge'
import { FakeCommunicationManager } from '../infra/communication'
import { FakePeriodicTaskScheduler } from '../infra/scheduler'
import { BackgroundListener } from '../service_workers/listener'
import { TimerStateStorageService } from '../domain/pomodoro/storage'
import { FocusSessionRecordStorageService } from '../domain/pomodoro/record/storage'
import { TimerConfigStorageService } from '../domain/pomodoro/config/storage'
import { WeeklyScheduleStorageService } from '../domain/schedules/storage'
import { BrowsingRulesStorageService } from '../domain/browsing_rules/storage'
import { FakeBrowsingControlService } from '../domain/browsing_control'
import { CurrentDateService } from '../infra/current_date'
import { NotificationSettingStorageService } from '../domain/notification_setting/storage'

export async function startBackgroundListener({
  focusSessionRecordHouseKeepDays = 30,
  timerConfig = config.getDefaultTimerConfig(),
  notificationSetting = config.getDefaultNotificationSetting(),
  notificationSettingStorageService = NotificationSettingStorageService.createFake(),
  browsingControlService = new FakeBrowsingControlService(),
  weeklyScheduleStorageService = WeeklyScheduleStorageService.createFake(),
  browsingRulesStorageService = BrowsingRulesStorageService.createFake(),
  desktopNotificationService = new FakeActionService(),
  reminderTabService = new FakeActionService(),
  soundService = new FakeActionService(),
  badgeDisplayService = new FakeBadgeDisplayService(),
  communicationManager = new FakeCommunicationManager(),
  timerStateStorageService = TimerStateStorageService.createFake(),
  timerConfigStorageService = TimerConfigStorageService.createFake(),
  closeTabsService = new FakeActionService(),
  focusSessionRecordStorageService = FocusSessionRecordStorageService.createFake(),
  currentDateService = CurrentDateService.createFake()
} = {}) {
  const scheduler = new FakePeriodicTaskScheduler()
  await timerConfigStorageService.save(timerConfig)
  const timer = PomodoroTimer.createFake({
    scheduler
  })

  await notificationSettingStorageService.save(notificationSetting)

  const listener = BackgroundListener.createFake({
    browsingControlService,
    weeklyScheduleStorageService,
    browsingRulesStorageService,
    communicationManager,
    desktopNotificationService,
    notificationSettingStorageService,
    reminderTabService,
    soundService,
    badgeDisplayService,
    timerStateStorageService,
    timerConfigStorageService,
    focusSessionRecordStorageService,
    closeTabsService,
    currentDateService,
    timer,
    focusSessionRecordHouseKeepDays
  })
  await listener.start()
  return {
    scheduler,
    timer: listener.timer,
    listener,
    desktopNotificationService,
    reminderTabService,
    soundService,
    badgeDisplayService,
    communicationManager,
    closeTabsService,
    timerStateStorageService,
    timerConfigStorageService,
    focusSessionRecordStorageService
  }
}
