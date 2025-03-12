import { ChromeCommunicationManager } from '../chrome/communication'
import { type WorkRequest, WorkRequestName } from './request'
import {
  FakeCommunicationManager,
  type CommunicationManager,
  type Port
} from '../infra/communication'
import { BrowsingControlTogglingService } from '../domain/browsing_control_toggling'
import { type PomodoroTimerResponse } from './response'
import { PomodoroTimer } from '../domain/pomodoro/timer'
import { FakeActionService, type ActionService } from '../infra/action'
import { ChromeNewTabReminderService } from '../chrome/new_tab'
import { FakeBadgeDisplayService, type BadgeColor, type BadgeDisplayService } from '../infra/badge'
import { ChromeBadgeDisplayService } from '../chrome/badge'
import { PomodoroStage } from '../domain/pomodoro/stage'
import config from '../config'
import { MultipleActionService } from '../infra/multiple_actions'
import { ChromeNotificationService } from '../chrome/notification'

export class BackgroundListener {
  private redirectTogglingService: BrowsingControlTogglingService
  private communicationManager: CommunicationManager
  private timer: PomodoroTimer
  private reminderService: ActionService
  private badgeDisplayService: BadgeDisplayService

  static create() {
    const reminderService = new MultipleActionService([
      new ChromeNewTabReminderService(),
      new ChromeNotificationService()
    ])

    return new BackgroundListener({
      communicationManager: new ChromeCommunicationManager(),
      timer: PomodoroTimer.create(),
      redirectTogglingService: BrowsingControlTogglingService.create(),
      reminderService,
      badgeDisplayService: new ChromeBadgeDisplayService()
    })
  }

  static createFake({
    timer = PomodoroTimer.createFake(),
    communicationManager = new FakeCommunicationManager(),
    redirectTogglingService = BrowsingControlTogglingService.createFake(),
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
    redirectTogglingService: BrowsingControlTogglingService
    reminderService: ActionService
    badgeDisplayService: BadgeDisplayService
  }) {
    this.communicationManager = communicationManager
    this.redirectTogglingService = redirectTogglingService
    this.reminderService = reminderService
    this.badgeDisplayService = badgeDisplayService

    this.timer = timer
    this.timer.setOnStageComplete(() => {
      this.reminderService.trigger()
      this.badgeDisplayService.clearBadge()
    })
    this.timer.subscribeTimerUpdate((newStatus) => {
      if (newStatus.isRunning) {
        this.badgeDisplayService.displayBadge({
          text: roundUpToRemainingMinutes(newStatus.remainingSeconds).toString(),
          color: getBadgeColor(newStatus.stage)
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
              const subscriptionId = this.timer.subscribeTimerUpdate((update) => {
                backgroundPort.send(update)
              })
              backgroundPort.onDisconnect(() => {
                console.debug('Connection closed, unsubscribing timer update.')
                this.timer.unsubscribeTimerUpdate(subscriptionId)
              })
              break
            }
            case WorkRequestName.PAUSE_TIMER: {
              this.timer.pause()
              this.badgeDisplayService.clearBadge()
              break
            }
            case WorkRequestName.RESTART_FOCUS: {
              this.timer.restartFocus(message.payload?.nth)
              break
            }
            case WorkRequestName.RESTART_SHORT_BREAK: {
              this.timer.restartShortBreak(message.payload?.nth)
              break
            }
            case WorkRequestName.RESTART_LONG_BREAK: {
              this.timer.restartLongBreak()
              break
            }
          }
        }
        backgroundPort.onMessage(listener)
      }
    )
  }
}

function roundUpToRemainingMinutes(remainingSeconds: number): number {
  return Math.ceil(remainingSeconds / 60)
}

function getBadgeColor(stage: PomodoroStage): BadgeColor {
  const colorConfig = config.getBadgeColorConfig()
  if (stage === PomodoroStage.FOCUS) {
    return colorConfig.focusBadgeColor
  } else {
    return colorConfig.breakBadgeColor
  }
}
