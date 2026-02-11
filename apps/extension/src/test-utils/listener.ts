import { WeeklySchedulesStorageService } from '@zero-in/shared/domain/schedules/storage'
import { TimerBasedBlockingRulesStorageService } from '@zero-in/shared/domain/timer-based-blocking/storage'
import { FocusSessionRecordsStorageService } from '@zero-in/shared/domain/timer/record/storage'
import { LocalStorageWrapper } from '@zero-in/shared/infra/storage/local-storage/index'
import config from '../config'
import { BrowsingRulesStorageService } from '../domain/browsing-rules/storage'
import { NotificationSettingStorageService } from '../domain/notification-setting/storage'
import { FocusTimer } from '../domain/timer'
import { TimerConfigStorageService } from '../domain/timer/config/storage'
import { TimerStateStorageService } from '../domain/timer/state/storage'
import { FakeActionService } from '../infra/action'
import { FakeBadgeDisplayService } from '../infra/badge'
import { FakeBrowsingControlService } from '../infra/browsing-control'
import { FakeCommunicationManager } from '../infra/communication'
import { DesktopNotificationService } from '../infra/desktop-notification'
import { BackgroundListener } from '../service-workers/listener'

export async function setUpListener({
  focusSessionRecordHouseKeepDays = 30,
  timerConfig = config.getDefaultTimerConfig(),
  timerStateStorageService = TimerStateStorageService.createFake(),
  timerConfigStorageService = TimerConfigStorageService.createFake()
} = {}) {
  const storage = LocalStorageWrapper.createFake()

  const params = {
    notificationSettingStorageService: new NotificationSettingStorageService(storage),
    timerBasedBlockingRulesStorageService: new TimerBasedBlockingRulesStorageService(storage),
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
    focusSessionRecordsStorageService: new FocusSessionRecordsStorageService(storage)
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
