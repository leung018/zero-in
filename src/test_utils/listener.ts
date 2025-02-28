import config from '../config'
import { PomodoroTimer } from '../domain/pomodoro/timer'
import { RedirectTogglingService } from '../domain/redirect_toggling'
import { FakeActionService } from '../infra/action'
import { FakeBadgeDisplayService } from '../infra/badge'
import { FakeCommunicationManager } from '../infra/communication'
import { FakePeriodicTaskScheduler } from '../infra/scheduler'
import { BackgroundListener } from '../service_workers/listener'

export function startBackgroundListener({
  timerConfig = config.getPomodoroTimerConfig(),
  redirectTogglingService = RedirectTogglingService.createFake(),
  reminderService = new FakeActionService(),
  badgeDisplayService = new FakeBadgeDisplayService(),
  communicationManager = new FakeCommunicationManager()
}) {
  const scheduler = new FakePeriodicTaskScheduler()
  const timer = PomodoroTimer.createFake({
    scheduler,
    ...timerConfig
  })

  const listener = BackgroundListener.createFake({
    timer,
    reminderService,
    badgeDisplayService,
    redirectTogglingService,
    communicationManager
  })
  listener.start()

  return { scheduler, timer, reminderService, badgeDisplayService, communicationManager }
}
