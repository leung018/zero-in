import { ChromeCommunicationManager } from '../chrome/communication'
import { EventName, type MappedEvents } from './event'
import {
  FakeCommunicationManager,
  type CommunicationManager,
  type Port
} from '../infra/communication'
import { FakePeriodicTaskScheduler } from '../infra/scheduler'
import { Duration } from '../domain/pomodoro/duration'
import { Timer } from '../domain/pomodoro/timer'
import { RedirectTogglingService } from '../domain/redirect_toggling'
import { ResponseName, type MappedResponses } from './response'

export class BackgroundListener {
  private redirectTogglingService: RedirectTogglingService
  private timerFactory: () => Timer
  private communicationManager: CommunicationManager

  static create() {
    return new BackgroundListener({
      communicationManager: new ChromeCommunicationManager(),
      timerFactory: () => Timer.create(),
      redirectTogglingService: RedirectTogglingService.create()
    })
  }

  static createFake({
    scheduler = new FakePeriodicTaskScheduler(),
    communicationManager = new FakeCommunicationManager(),
    redirectTogglingService = RedirectTogglingService.createFake()
  } = {}) {
    return new BackgroundListener({
      communicationManager,
      timerFactory: () => Timer.createFake(scheduler),
      redirectTogglingService
    })
  }

  private constructor({
    communicationManager,
    timerFactory,
    redirectTogglingService
  }: {
    communicationManager: CommunicationManager
    timerFactory: () => Timer
    redirectTogglingService: RedirectTogglingService
  }) {
    this.communicationManager = communicationManager
    this.timerFactory = timerFactory
    this.redirectTogglingService = redirectTogglingService
  }

  start() {
    this.communicationManager.addClientConnectListener(
      (backgroundPort: Port<MappedResponses[ResponseName], MappedEvents[EventName]>) => {
        const listener = (message: MappedEvents[EventName]) => {
          switch (message.name) {
            case EventName.POMODORO_START: {
              const timer = this.timerFactory()
              timer.setOnTick((remaining) => {
                backgroundPort.send({
                  name: ResponseName.POMODORO_TIMER_UPDATE,
                  payload: {
                    remainingSeconds: remaining.totalSeconds
                  }
                })
              })
              timer.start(new Duration({ seconds: message.payload.initialSeconds }))
              break
            }
            case EventName.TOGGLE_REDIRECT_RULES: {
              this.redirectTogglingService.run()
              break
            }
          }
        }
        backgroundPort.addListener(listener)
      }
    )
  }
}
