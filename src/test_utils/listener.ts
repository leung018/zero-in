import config from '../config'
import { PomodoroTimer } from '../domain/pomodoro/timer'
import { BrowsingControlTogglingService } from '../domain/browsing_control_toggling'
import { FakeActionService } from '../infra/action'
import { FakeBadgeDisplayService } from '../infra/badge'
import { FakeCommunicationManager } from '../infra/communication'
import { FakePeriodicTaskScheduler } from '../infra/scheduler'
import { BackgroundListener } from '../service_workers/listener'
import { PomodoroTimerStateStorageService } from '../domain/pomodoro/storage'
import { PomodoroRecordStorageService } from '../domain/pomodoro/record/storage'
import type { PomodoroTimerConfig } from '../domain/pomodoro/config'
import { PomodoroTimerConfigStorageService } from '../domain/pomodoro/config/storage'

export async function startBackgroundListener({
  timerConfig = config.getPomodoroTimerConfig(),
  redirectTogglingService = BrowsingControlTogglingService.createFake(),
  reminderService = new FakeActionService(),
  badgeDisplayService = new FakeBadgeDisplayService(),
  communicationManager = new FakeCommunicationManager(),
  timerStateStorageService = PomodoroTimerStateStorageService.createFake(),
  timerConfigStorageService = PomodoroTimerConfigStorageService.createFake(),
  closeTabsService = new FakeActionService(),
  pomodoroRecordStorageService = PomodoroRecordStorageService.createFake(),
  getCurrentDate = undefined
}: {
  timerConfig?: PomodoroTimerConfig
  redirectTogglingService?: BrowsingControlTogglingService
  reminderService?: FakeActionService
  badgeDisplayService?: FakeBadgeDisplayService
  communicationManager?: FakeCommunicationManager
  timerStateStorageService?: PomodoroTimerStateStorageService
  timerConfigStorageService?: PomodoroTimerConfigStorageService
  closeTabsService?: FakeActionService
  pomodoroRecordStorageService?: PomodoroRecordStorageService
  getCurrentDate?: () => Date
}) {
  const scheduler = new FakePeriodicTaskScheduler()
  await timerConfigStorageService.save(timerConfig)
  const newTimer = (tc: PomodoroTimerConfig) => {
    return PomodoroTimer.createFake({
      scheduler,
      pomodoroRecordStorageService,
      timerConfig: tc,
      getCurrentDate
    })
  }
  return BackgroundListener.startFake({
    newTimer,
    reminderService,
    badgeDisplayService,
    redirectTogglingService,
    communicationManager,
    timerStateStorageService,
    timerConfigStorageService,
    closeTabsService
  }).then((timer) => {
    return {
      scheduler,
      timer,
      reminderService,
      badgeDisplayService,
      communicationManager,
      closeTabsService,
      timerConfigStorageService
    }
  })
}
