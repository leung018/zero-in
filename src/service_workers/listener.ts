import { ChromeCommunicationManager } from '../chrome/communication'
import { type WorkRequest, WorkRequestName } from './request'
import {
  FakeCommunicationManager,
  type CommunicationManager,
  type Port
} from '../infra/communication'
import { BrowsingControlTogglingService } from '../domain/browsing_control_toggling'
import { WorkResponseName, type WorkResponse } from './response'
import { PomodoroTimer } from '../domain/pomodoro/timer'
import { FakeActionService, type ActionService } from '../infra/action'
import { ChromeNewTabService } from '../chrome/new_tab'
import { FakeBadgeDisplayService, type BadgeColor, type BadgeDisplayService } from '../infra/badge'
import { ChromeBadgeDisplayService } from '../chrome/badge'
import { PomodoroStage } from '../domain/pomodoro/stage'
import config from '../config'
import { MultipleActionService } from '../infra/multiple_actions'
import { ChromeNotificationService } from '../chrome/notification'
import { TimerStateStorageService } from '../domain/pomodoro/storage'
import { ChromeCloseTabsService } from '../chrome/close_tabs'
import { TimerConfigStorageService } from '../domain/pomodoro/config/storage'
import type { TimerConfig } from '../domain/pomodoro/config'
import { FocusSessionRecordStorageService } from '../domain/pomodoro/record/storage'
import { newFocusSessionRecord } from '../domain/pomodoro/record'
import { FocusSessionRecordHousekeeper } from '../domain/pomodoro/record/house_keep'
import { SubscriptionManager } from '../utils/subscription'

export class BackgroundListener {
  static async start() {
    const reminderService = new MultipleActionService([
      new ChromeNewTabService(config.getReminderPageUrl()),
      new ChromeNotificationService()
    ])

    return BackgroundListener._start({
      communicationManager: new ChromeCommunicationManager(),
      focusSessionRecordHouseKeepDays: config.getFocusSessionRecordHouseKeepDays(),
      focusSessionRecordStorageService: FocusSessionRecordStorageService.create(),
      timerFactory: (timerConfig) => {
        return PomodoroTimer.create(timerConfig)
      },
      redirectTogglingService: BrowsingControlTogglingService.create(),
      reminderService,
      badgeDisplayService: new ChromeBadgeDisplayService(),
      timerStateStorageService: TimerStateStorageService.create(),
      timerConfigStorageService: TimerConfigStorageService.create(),
      closeTabsService: new ChromeCloseTabsService(config.getReminderPageUrl())
    })
  }

  static async startFake({
    timerFactory = (timerConfig: TimerConfig) => PomodoroTimer.createFake({ timerConfig }),
    focusSessionRecordHouseKeepDays = 30,
    focusSessionRecordStorageService = FocusSessionRecordStorageService.createFake(),
    communicationManager = new FakeCommunicationManager(),
    redirectTogglingService = BrowsingControlTogglingService.createFake(),
    reminderService = new FakeActionService(),
    badgeDisplayService = new FakeBadgeDisplayService(),
    timerStateStorageService = TimerStateStorageService.createFake(),
    timerConfigStorageService = TimerConfigStorageService.createFake(),
    closeTabsService = new FakeActionService(),
    getCurrentDate = undefined
  }: {
    timerFactory?: (timerConfig: TimerConfig) => PomodoroTimer
    focusSessionRecordHouseKeepDays?: number
    focusSessionRecordStorageService?: FocusSessionRecordStorageService
    communicationManager?: CommunicationManager
    redirectTogglingService?: BrowsingControlTogglingService
    reminderService?: ActionService
    badgeDisplayService?: BadgeDisplayService
    timerStateStorageService?: TimerStateStorageService
    timerConfigStorageService?: TimerConfigStorageService
    closeTabsService?: ActionService
    getCurrentDate?: () => Date
  } = {}) {
    return BackgroundListener._start({
      communicationManager,
      focusSessionRecordHouseKeepDays,
      focusSessionRecordStorageService,
      timerFactory,
      redirectTogglingService,
      reminderService,
      badgeDisplayService,
      timerStateStorageService,
      timerConfigStorageService,
      closeTabsService,
      getCurrentDate
    })
  }

  private static async _start({
    communicationManager,
    focusSessionRecordHouseKeepDays,
    focusSessionRecordStorageService,
    timerFactory,
    redirectTogglingService,
    reminderService,
    badgeDisplayService,
    timerStateStorageService,
    timerConfigStorageService,
    closeTabsService,
    getCurrentDate = () => new Date()
  }: {
    communicationManager: CommunicationManager
    focusSessionRecordHouseKeepDays: number
    focusSessionRecordStorageService: FocusSessionRecordStorageService
    timerFactory: (timerConfig: TimerConfig) => PomodoroTimer
    redirectTogglingService: BrowsingControlTogglingService
    reminderService: ActionService
    badgeDisplayService: BadgeDisplayService
    timerStateStorageService: TimerStateStorageService
    timerConfigStorageService: TimerConfigStorageService
    closeTabsService: ActionService
    getCurrentDate?: () => Date
  }) {
    const timerConfig = {
      ...(await timerConfigStorageService.get()),
      focusSessionRecordHouseKeepDays
    }
    const timer = timerFactory(timerConfig)
    const backupState = await timerStateStorageService.get()
    if (backupState) {
      timer.setState(backupState)
    }

    const listener = new BackgroundListener({
      getCurrentDate,
      communicationManager,
      timer,
      redirectTogglingService,
      reminderService,
      badgeDisplayService,
      timerStateStorageService,
      timerConfigStorageService,
      focusSessionRecordStorageService,
      focusSessionRecordHouseKeepDays,
      closeTabsService
    })

    listener.start()

    return listener
  }

  private redirectTogglingService: BrowsingControlTogglingService
  private communicationManager: CommunicationManager
  readonly timer: PomodoroTimer // TODO: Make it private when removed the dependency on timer in tests of listener
  private reminderService: ActionService
  private badgeDisplayService: BadgeDisplayService
  private timerStateStorageService: TimerStateStorageService
  private timerConfigStorageService: TimerConfigStorageService
  private closeTabsService: ActionService

  private focusSessionRecordStorageService: FocusSessionRecordStorageService
  private focusSessionRecordHouseKeepDays: number
  private focusSessionRecordsUpdateSubscriptionManager = new SubscriptionManager()
  private getCurrentDate: () => Date

  private constructor({
    communicationManager,
    timer,
    redirectTogglingService,
    reminderService,
    badgeDisplayService,
    timerStateStorageService,
    timerConfigStorageService,
    focusSessionRecordStorageService,
    focusSessionRecordHouseKeepDays,
    closeTabsService,
    getCurrentDate
  }: {
    communicationManager: CommunicationManager
    timer: PomodoroTimer
    redirectTogglingService: BrowsingControlTogglingService
    reminderService: ActionService
    badgeDisplayService: BadgeDisplayService
    timerStateStorageService: TimerStateStorageService
    timerConfigStorageService: TimerConfigStorageService
    focusSessionRecordStorageService: FocusSessionRecordStorageService
    focusSessionRecordHouseKeepDays: number
    closeTabsService: ActionService
    getCurrentDate: () => Date
  }) {
    this.communicationManager = communicationManager
    this.redirectTogglingService = redirectTogglingService
    this.reminderService = reminderService
    this.badgeDisplayService = badgeDisplayService
    this.timerStateStorageService = timerStateStorageService
    this.timerConfigStorageService = timerConfigStorageService
    this.closeTabsService = closeTabsService
    this.focusSessionRecordStorageService = focusSessionRecordStorageService
    this.focusSessionRecordHouseKeepDays = focusSessionRecordHouseKeepDays
    this.getCurrentDate = getCurrentDate

    this.timer = timer
  }

  private start() {
    this.setUpTimerSubscriptions()
    this.setUpListener()
  }

  private setUpTimerSubscriptions() {
    this.timer.setOnStageComplete((completedStage) => {
      this.reminderService.trigger()
      this.badgeDisplayService.clearBadge()

      if (completedStage === PomodoroStage.FOCUS) {
        this.updateFocusSessionRecords()
      }
    })
    this.timer.subscribeTimerState((newState) => {
      this.timerStateStorageService.save(newState)

      if (newState.isRunning) {
        this.badgeDisplayService.displayBadge({
          text: roundUpToRemainingMinutes(newState.remainingSeconds).toString(),
          color: getBadgeColor(newState.stage)
        })
      }
    })
  }

  private async updateFocusSessionRecords() {
    return this.focusSessionRecordStorageService
      .getAll()
      .then((records) => {
        this.focusSessionRecordStorageService.saveAll([
          ...records,
          newFocusSessionRecord(this.getCurrentDate())
        ])
      })
      .then(() => {
        FocusSessionRecordHousekeeper.houseKeep({
          focusSessionRecordStorageService: this.focusSessionRecordStorageService,
          houseKeepDays: this.focusSessionRecordHouseKeepDays
        })
      })
      .then(() => {
        this.focusSessionRecordsUpdateSubscriptionManager.broadcast(undefined)
      })
  }

  getFocusSessionRecordsUpdateSubscriptionCount() {
    return this.focusSessionRecordsUpdateSubscriptionManager.getSubscriptionCount()
  }

  private setUpListener() {
    this.communicationManager.onNewClientConnect(
      (backgroundPort: Port<WorkResponse, WorkRequest>) => {
        const listener = (message: WorkRequest) => {
          switch (message.name) {
            case WorkRequestName.TOGGLE_REDIRECT_RULES: {
              this.redirectTogglingService.run()
              break
            }
            case WorkRequestName.START_TIMER: {
              this.timer.start()
              this.closeTabsService.trigger()
              break
            }
            case WorkRequestName.PAUSE_TIMER: {
              this.timer.pause()
              this.badgeDisplayService.clearBadge()
              break
            }
            case WorkRequestName.LISTEN_TO_TIMER: {
              const subscriptionId = this.timer.subscribeTimerState((update) => {
                backgroundPort.send({
                  name: WorkResponseName.TIMER_STATE,
                  payload: update
                })
              })
              backgroundPort.onDisconnect(() => {
                console.debug('Connection closed, unsubscribing timer update.')
                this.timer.unsubscribeTimerState(subscriptionId)
              })
              break
            }
            case WorkRequestName.LISTEN_TO_POMODORO_RECORDS_UPDATE: {
              const subscriptionId = this.focusSessionRecordsUpdateSubscriptionManager.subscribe(
                () => {
                  backgroundPort.send({
                    name: WorkResponseName.POMODORO_RECORDS_UPDATED
                  })
                }
              )
              backgroundPort.onDisconnect(() => {
                this.focusSessionRecordsUpdateSubscriptionManager.unsubscribe(subscriptionId)
              })
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
            case WorkRequestName.RESET_TIMER_CONFIG: {
              this.timerConfigStorageService.get().then((config) => {
                this.timer.setConfig(config)
              })
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
