import { ChromeCommunicationManager } from '../chrome/communication'
import { type WorkRequest, WorkRequestName } from './request'
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
import { FakeBadgeDisplayService, type BadgeColor, type BadgeDisplayService } from '../infra/badge'
import { ChromeBadgeDisplayService } from '../chrome/badge'
import { PomodoroStage } from '../domain/pomodoro/stage'
import config from '../config'

export class BackgroundListener {
  private redirectTogglingService: RedirectTogglingService
  private communicationManager: CommunicationManager
  private timer: PomodoroTimer
  private reminderService: ActionService
  private badgeDisplayService: BadgeDisplayService

  static create() {
    return new BackgroundListener({
      communicationManager: new ChromeCommunicationManager(),
      timer: PomodoroTimer.create(),
      redirectTogglingService: RedirectTogglingService.create(),
      reminderService: new ChromeNewTabReminderService(),
      badgeDisplayService: new ChromeBadgeDisplayService()
    })
  }

  static createFake({
    timer = PomodoroTimer.createFake(),
    communicationManager = new FakeCommunicationManager(),
    redirectTogglingService = RedirectTogglingService.createFake(),
    reminderService = new FakeActionService(),
    badgeDisplayService = new FakeBadgeDisplayService()
  } = {}) {
    return new BackgroundListener({
      communicationManager,
      timer: timer,
      redirectTogglingService,
      reminderService,
      badgeDisplayService
    })
  }

  private constructor({
    communicationManager,
    timer,
    redirectTogglingService,
    reminderService,
    badgeDisplayService
  }: {
    communicationManager: CommunicationManager
    timer: PomodoroTimer
    redirectTogglingService: RedirectTogglingService
    reminderService: ActionService
    badgeDisplayService: BadgeDisplayService
  }) {
    this.communicationManager = communicationManager
    this.redirectTogglingService = redirectTogglingService
    this.reminderService = reminderService
    this.badgeDisplayService = badgeDisplayService

    this.timer = timer
    this.timer.setOnStageTransit(() => {
      this.reminderService.trigger()
      this.badgeDisplayService.clearBadge()
    })
    this.timer.subscribeTimerUpdate((state) => {
      if (state.isRunning) {
        this.badgeDisplayService.displayBadge({
          text: roundUpTimeLeftInMinutes(state.remaining.timeLeft()).toString(),
          color: getBadgeColor(state.stage)
        })
      }
    })
  }

  start() {
    this.communicationManager.onNewClientConnect(
      (backgroundPort: Port<PomodoroTimerResponse, WorkRequest>) => {
        const listener = (message: WorkRequest) => {
          switch (message.name) {
            case WorkRequestName.START_TIMER: {
              this.timer.start()
              break
            }
            case WorkRequestName.TOGGLE_REDIRECT_RULES: {
              this.redirectTogglingService.run()
              break
            }
            case WorkRequestName.LISTEN_TO_TIMER: {
              backgroundPort.send(mapPomodoroTimerStateToResponse(this.timer.getState()))
              const subscriptionId = this.timer.subscribeTimerUpdate((state) => {
                backgroundPort.send(mapPomodoroTimerStateToResponse(state))
              })
              backgroundPort.onDisconnect(() => {
                this.timer.unsubscribeTimerUpdate(subscriptionId)
              })
              break
            }
            case WorkRequestName.PAUSE_TIMER: {
              this.timer.pause()
              this.badgeDisplayService.clearBadge()
              break
            }
          }
        }
        backgroundPort.onMessage(listener)
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

function roundUpTimeLeftInMinutes(timeLeft: { minutes: number; seconds: number }): number {
  if (timeLeft.seconds > 0) {
    return timeLeft.minutes + 1
  }
  return timeLeft.minutes
}

function getBadgeColor(stage: PomodoroStage): BadgeColor {
  const colorConfig = config.getBadgeColorConfig()
  if (stage === PomodoroStage.FOCUS) {
    return colorConfig.focusBadgeColor
  } else {
    return colorConfig.breakBadgeColor
  }
}
