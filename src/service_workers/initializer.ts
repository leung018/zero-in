import { ChromeCommunicationManager } from '../chrome/communication'
import { EventName } from './event'
import {
  FakeCommunicationManager,
  type CommunicationManager,
  type Port
} from '../infra/communication'
import { FakePeriodicTaskScheduler } from '../infra/scheduler'
import { Duration } from '../domain/pomodoro/duration'
import { Timer } from '../domain/pomodoro/timer'
import { RedirectTogglingService } from '../domain/redirect_toggling'

export class ConnectionListenerInitializer {
  static init() {
    return this.initListener({
      communicationManager: new ChromeCommunicationManager(),
      timerFactory: () => Timer.create(),
      redirectTogglingService: RedirectTogglingService.create()
    })
  }

  static fakeInit({
    scheduler = new FakePeriodicTaskScheduler(),
    communicationManager = new FakeCommunicationManager(),
    redirectTogglingService = RedirectTogglingService.createFake()
  } = {}) {
    return this.initListener({
      communicationManager,
      timerFactory: () => Timer.createFake(scheduler),
      redirectTogglingService
    })
  }

  private static initListener({
    communicationManager,
    timerFactory,
    redirectTogglingService
  }: {
    communicationManager: CommunicationManager
    timerFactory: () => Timer
    redirectTogglingService: RedirectTogglingService
  }) {
    communicationManager.addClientConnectListener((backgroundPort: Port) => {
      backgroundPort.addListener((message) => {
        if (message.name == EventName.POMODORO_START) {
          const timer = timerFactory()
          timer.setOnTick((remaining) => {
            backgroundPort.send(remaining.totalSeconds)
          })
          timer.start(new Duration({ seconds: message.initial }))
        } else if (message.name == EventName.TOGGLE_REDIRECT_RULES) {
          redirectTogglingService.run()
        }
      })
    })
  }
}
