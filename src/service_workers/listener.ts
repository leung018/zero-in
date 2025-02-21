import { ChromeCommunicationManager } from '../chrome/communication'
import { type Event, EventName } from './event'
import {
  FakeCommunicationManager,
  type CommunicationManager,
  type Port
} from '../infra/communication'
import { FakePeriodicTaskScheduler } from '../infra/scheduler'
import { Duration } from '../domain/pomodoro/duration'
import { RedirectTogglingService } from '../domain/redirect_toggling'
import { type PomodoroTimerResponse } from './response'
import { PomodoroTimer, type PomodoroTimerState } from '../domain/pomodoro/timer'

export class BackgroundListener {
  private redirectTogglingService: RedirectTogglingService
  private communicationManager: CommunicationManager
  private timer: PomodoroTimer

  static create() {
    return new BackgroundListener({
      communicationManager: new ChromeCommunicationManager(),
      timer: PomodoroTimer.create(),
      redirectTogglingService: RedirectTogglingService.create()
    })
  }

  static createFake({
    scheduler = new FakePeriodicTaskScheduler(),
    communicationManager = new FakeCommunicationManager(),
    redirectTogglingService = RedirectTogglingService.createFake(),
    focusDuration = new Duration({ minutes: 25 }),
    restDuration = new Duration({ minutes: 5 })
  } = {}) {
    return new BackgroundListener({
      communicationManager,
      timer: PomodoroTimer.createFake({
        scheduler,
        focusDuration,
        restDuration
      }),
      redirectTogglingService
    })
  }

  private constructor({
    communicationManager,
    timer,
    redirectTogglingService
  }: {
    communicationManager: CommunicationManager
    timer: PomodoroTimer
    redirectTogglingService: RedirectTogglingService
  }) {
    this.communicationManager = communicationManager
    this.redirectTogglingService = redirectTogglingService
    this.timer = timer
  }

  start() {
    this.communicationManager.addClientConnectListener(
      (backgroundPort: Port<PomodoroTimerResponse, Event>) => {
        const listener = (message: Event) => {
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
              backgroundPort.send(mapPomodoroTimerStateToResponse(this.timer.getState()))
              this.timer.setCallback((state) => {
                backgroundPort.send(mapPomodoroTimerStateToResponse(state))
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

function mapPomodoroTimerStateToResponse(state: PomodoroTimerState): PomodoroTimerResponse {
  return {
    pomodoroState: state.stage,
    remainingSeconds: state.remaining.totalSeconds,
    isRunning: state.isRunning
  }
}
