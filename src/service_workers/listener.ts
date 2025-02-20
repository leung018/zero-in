import { ChromeCommunicationManager } from '../chrome/communication'
import { type Event, EventName } from './event'
import {
  FakeCommunicationManager,
  type CommunicationManager,
  type Port
} from '../infra/communication'
import { FakePeriodicTaskScheduler } from '../infra/scheduler'
import { Duration } from '../domain/pomodoro/duration'
import { Timer, type TimerState } from '../domain/pomodoro/timer'
import { RedirectTogglingService } from '../domain/redirect_toggling'
import { PomodoroState, type PomodoroTimerResponse } from './response'
import config from '../config'

export class BackgroundListener {
  private redirectTogglingService: RedirectTogglingService
  private communicationManager: CommunicationManager
  private timer: Timer
  private pomodoroState: PomodoroState = PomodoroState.FOCUS
  private restDuration: Duration

  static create() {
    return new BackgroundListener({
      communicationManager: new ChromeCommunicationManager(),
      timer: Timer.create(config.getFocusDuration()),
      redirectTogglingService: RedirectTogglingService.create(),
      restDuration: new Duration({ minutes: 5 })
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
      timer: Timer.createFake({ scheduler, initialDuration: focusDuration }),
      redirectTogglingService,
      restDuration
    })
  }

  private constructor({
    communicationManager,
    timer,
    redirectTogglingService,
    restDuration
  }: {
    communicationManager: CommunicationManager
    timer: Timer
    redirectTogglingService: RedirectTogglingService
    restDuration: Duration
  }) {
    this.communicationManager = communicationManager
    this.redirectTogglingService = redirectTogglingService
    this.timer = timer
    this.restDuration = restDuration
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
              backgroundPort.send(
                newPomodoroTimerResponse(this.timer.getState(), this.pomodoroState)
              )
              this.timer.subscribe((timerState) => {
                if (timerState.remaining.isZero()) {
                  this.pomodoroState = PomodoroState.REST
                  this.timer.reset(this.restDuration)
                  backgroundPort.send(
                    newPomodoroTimerResponse(this.timer.getState(), this.pomodoroState)
                  )
                  return
                }
                backgroundPort.send(newPomodoroTimerResponse(timerState, this.pomodoroState))
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

function newPomodoroTimerResponse(
  timerState: TimerState,
  pomodoroState: PomodoroState
): PomodoroTimerResponse {
  return {
    pomodoroState,
    remainingSeconds: timerState.remaining.totalSeconds,
    isRunning: timerState.isRunning
  }
}
