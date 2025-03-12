import config from '../config'
import { PomodoroTimer } from '../domain/pomodoro/timer'
import { BrowsingControlTogglingService } from '../domain/browsing_control_toggling'
import { FakeActionService } from '../infra/action'
import { FakeBadgeDisplayService } from '../infra/badge'
import { FakeCommunicationManager } from '../infra/communication'
import { FakePeriodicTaskScheduler } from '../infra/scheduler'
import { BackgroundListener } from '../service_workers/listener'
import { TimerUpdateStorageService } from '../domain/pomodoro/storage'

export function startBackgroundListener({
  timerConfig = config.getPomodoroTimerConfig(),
  redirectTogglingService = BrowsingControlTogglingService.createFake(),
  reminderService = new FakeActionService(),
  badgeDisplayService = new FakeBadgeDisplayService(),
  communicationManager = new FakeCommunicationManager(),
  timerUpdateStorageService = TimerUpdateStorageService.createFake()
}) {
  const scheduler = new FakePeriodicTaskScheduler()
  const timer = PomodoroTimer.createFake({
    scheduler,
    timerConfig
  })

  const listener = BackgroundListener.createFake({
    timer,
    reminderService,
    badgeDisplayService,
    redirectTogglingService,
    communicationManager,
    timerUpdateStorageService
  })
  listener.start()

  return { scheduler, timer, reminderService, badgeDisplayService, communicationManager }
}
