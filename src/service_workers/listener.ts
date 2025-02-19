import { ChromeCommunicationManager } from '../chrome/communication'
import { EventName, type MappedEvents } from './event'
import {
  FakeCommunicationManager,
  type CommunicationManager,
  type Port
} from '../infra/communication'
import { FakePeriodicTaskScheduler } from '../infra/scheduler'
import { Duration } from '../domain/pomodoro/duration'
import { Timer, type TimerState } from '../domain/pomodoro/timer'
import { RedirectTogglingService } from '../domain/redirect_toggling'
import { ResponseName, type MappedResponses, type PomodoroTimerStatePayload } from './response'

export class BackgroundListener {
  private redirectTogglingService: RedirectTogglingService
  private communicationManager: CommunicationManager
  private timer: Timer

  static create() {
    return new BackgroundListener({
      communicationManager: new ChromeCommunicationManager(),
      timer: Timer.create(),
      redirectTogglingService: RedirectTogglingService.create()
    })
  }

  static createFake({
    scheduler = new FakePeriodicTaskScheduler(),
    communicationManager = new FakeCommunicationManager(),
    redirectTogglingService = RedirectTogglingService.createFake(),
    focusDuration = new Duration({ minutes: 25 })
  } = {}) {
    return new BackgroundListener({
      communicationManager,
      timer: Timer.createFake({ scheduler, focusDuration }),
      redirectTogglingService
    })
  }

  private constructor({
    communicationManager,
    timer,
    redirectTogglingService
  }: {
    communicationManager: CommunicationManager
    timer: Timer
    redirectTogglingService: RedirectTogglingService
  }) {
    this.communicationManager = communicationManager
    this.redirectTogglingService = redirectTogglingService
    this.timer = timer
  }

  start() {
    this.communicationManager.addClientConnectListener(
      (backgroundPort: Port<MappedResponses[ResponseName], MappedEvents[EventName]>) => {
        const listener = (message: MappedEvents[EventName]) => {
          switch (message.name) {
            case EventName.POMODORO_START: {
              this.timer.start()
              break
            }
            case EventName.TOGGLE_REDIRECT_RULES: {
              this.redirectTogglingService.run()
              break
            }
            case EventName.POMODORO_QUERY: {
              backgroundPort.send({
                name: ResponseName.POMODORO_TIMER_STATE,
                payload: mapTimerStateToPomodoroTimerStatePayload(this.timer.getState())
              })
              this.timer.subscribe((remaining) => {
                backgroundPort.send({
                  name: ResponseName.POMODORO_TIMER_STATE,
                  payload: mapTimerStateToPomodoroTimerStatePayload(remaining)
                })
              })
              break
            }
            case EventName.POMODORO_PAUSE: {
              this.timer.pause()
              break
            }
          }
        }
        backgroundPort.addListener(listener)
      }
    )
  }
}

function mapTimerStateToPomodoroTimerStatePayload(
  timerState: TimerState
): PomodoroTimerStatePayload {
  return {
    remainingSeconds: timerState.remaining.totalSeconds,
    isRunning: timerState.isRunning
  }
}
