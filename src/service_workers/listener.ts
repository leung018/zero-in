import { ChromeCommunicationManager } from '../chrome/communication'
import { type Event, EventName } from './event'
import {
  FakeCommunicationManager,
  type CommunicationManager,
  type Port
} from '../infra/communication'
import { RedirectTogglingService } from '../domain/redirect_toggling'
import { type PomodoroTimerResponse } from './response'
import { PomodoroTimer, type PomodoroTimerState } from '../domain/pomodoro/timer'
import { FakeActionService, type ActionService } from '../infra/action'
import { ChromeNewTabReminderService } from '../chrome/new_tab'

export class BackgroundListener {
  private redirectTogglingService: RedirectTogglingService
  private communicationManager: CommunicationManager
  private timer: PomodoroTimer
  private reminderService: ActionService

  static create() {
    return new BackgroundListener({
      communicationManager: new ChromeCommunicationManager(),
      timer: PomodoroTimer.create(),
      redirectTogglingService: RedirectTogglingService.create(),
      reminderService: new ChromeNewTabReminderService() // TODO: Currently just test this ReminderService integration manually. Find way to automate this in future.
    })
  }

  static createFake({
    timer = PomodoroTimer.createFake(),
    communicationManager = new FakeCommunicationManager(),
    redirectTogglingService = RedirectTogglingService.createFake(),
    reminderService = new FakeActionService()
  } = {}) {
    return new BackgroundListener({
      communicationManager,
      timer: timer,
      redirectTogglingService,
      reminderService
    })
  }

  private constructor({
    communicationManager,
    timer,
    redirectTogglingService,
    reminderService
  }: {
    communicationManager: CommunicationManager
    timer: PomodoroTimer
    redirectTogglingService: RedirectTogglingService
    reminderService: ActionService
  }) {
    this.communicationManager = communicationManager
    this.redirectTogglingService = redirectTogglingService
    this.reminderService = reminderService
    this.timer = timer
    this.timer.setOnStageTransit(() => {
      this.reminderService.trigger()
    })
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
              this.timer.setOnTimerUpdate((state) => {
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
    stage: state.stage,
    remainingSeconds: state.remaining.totalMilliseconds / 1000,
    isRunning: state.isRunning
  }
}
