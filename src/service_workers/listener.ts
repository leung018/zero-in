import { type WorkRequest, WorkRequestName } from './request'
import { type CommunicationManager, type Port } from '../infra/communication'
import { BrowsingControlTogglingService } from '../domain/browsing_control_toggling'
import { WorkResponseName, type WorkResponse } from './response'
import { PomodoroTimer } from '../domain/pomodoro/timer'
import { type ActionService } from '../infra/action'
import { type BadgeColor, type BadgeDisplayService } from '../infra/badge'
import { PomodoroStage } from '../domain/pomodoro/stage'
import config from '../config'
import { TimerStateStorageService } from '../domain/pomodoro/storage'
import { TimerConfigStorageService } from '../domain/pomodoro/config/storage'
import { FocusSessionRecordStorageService } from '../domain/pomodoro/record/storage'
import { newFocusSessionRecord } from '../domain/pomodoro/record'
import { FocusSessionRecordHousekeeper } from '../domain/pomodoro/record/house_keep'
import { SubscriptionManager } from '../utils/subscription'
import { CurrentDateService } from '../infra/current_date'
import type { BrowsingControlService } from '../domain/browsing_control'
import { BrowsingRulesStorageService } from '../domain/browsing_rules/storage'
import { WeeklyScheduleStorageService } from '../domain/schedules/storage'
import { ChromeCommunicationManager } from '../chrome/communication'
import { MultipleActionService } from '../infra/multiple_actions'
import { ChromeNewTabService } from '../chrome/new_tab'
import { ChromeNotificationService } from '../chrome/notification'
import { ChromeBadgeDisplayService } from '../chrome/badge'
import { ChromeCloseTabsService } from '../chrome/close_tabs'
import { ChromeBrowsingControlService } from '../chrome/browsing_control'
import { SoundService } from '../chrome/sound'

type ListenerParams = {
  communicationManager: CommunicationManager
  newTabService: ActionService
  notificationService: ActionService
  soundService: ActionService
  badgeDisplayService: BadgeDisplayService
  timerStateStorageService: TimerStateStorageService
  timerConfigStorageService: TimerConfigStorageService
  focusSessionRecordStorageService: FocusSessionRecordStorageService
  closeTabsService: ActionService
  browsingControlService: BrowsingControlService
  browsingRulesStorageService: BrowsingRulesStorageService
  weeklyScheduleStorageService: WeeklyScheduleStorageService
  currentDateService: CurrentDateService
  focusSessionRecordHouseKeepDays: number
  timer: PomodoroTimer
}

export class BackgroundListener {
  static create() {
    return new BackgroundListener({
      communicationManager: new ChromeCommunicationManager(),
      newTabService: new ChromeNewTabService(config.getReminderPageUrl()),
      notificationService: new ChromeNotificationService(),
      soundService: new SoundService(),
      badgeDisplayService: new ChromeBadgeDisplayService(),
      timerStateStorageService: TimerStateStorageService.create(),
      timerConfigStorageService: TimerConfigStorageService.create(),
      focusSessionRecordStorageService: FocusSessionRecordStorageService.create(),
      closeTabsService: new ChromeCloseTabsService(config.getReminderPageUrl()),
      browsingControlService: new ChromeBrowsingControlService(),
      browsingRulesStorageService: BrowsingRulesStorageService.create(),
      weeklyScheduleStorageService: WeeklyScheduleStorageService.create(),
      currentDateService: CurrentDateService.create(),
      focusSessionRecordHouseKeepDays: config.getFocusSessionRecordHouseKeepDays(),
      timer: PomodoroTimer.create()
    })
  }

  static createFake(params: ListenerParams) {
    return new BackgroundListener(params)
  }

  private browsingControlTogglingService: BrowsingControlTogglingService
  private communicationManager: CommunicationManager
  readonly timer: PomodoroTimer // TODO: Make it private when removed the dependency on timer in tests of listener
  private reminderService: ActionService
  private badgeDisplayService: BadgeDisplayService
  private timerStateStorageService: TimerStateStorageService
  private timerConfigStorageService: TimerConfigStorageService
  private closeTabsService: ActionService
  private currentDateService: CurrentDateService

  private focusSessionRecordStorageService: FocusSessionRecordStorageService
  private focusSessionRecordHouseKeepDays: number
  private focusSessionRecordsUpdateSubscriptionManager = new SubscriptionManager()

  private constructor(params: ListenerParams) {
    this.communicationManager = params.communicationManager
    this.browsingControlTogglingService = new BrowsingControlTogglingService({
      browsingControlService: params.browsingControlService,
      browsingRulesStorageService: params.browsingRulesStorageService,
      weeklyScheduleStorageService: params.weeklyScheduleStorageService,
      currentDateService: params.currentDateService
    })
    this.reminderService = new MultipleActionService([
      params.newTabService,
      params.notificationService,
      params.soundService
    ])
    this.badgeDisplayService = params.badgeDisplayService
    this.timerStateStorageService = params.timerStateStorageService
    this.timerConfigStorageService = params.timerConfigStorageService
    this.closeTabsService = params.closeTabsService
    this.focusSessionRecordStorageService = params.focusSessionRecordStorageService
    this.focusSessionRecordHouseKeepDays = params.focusSessionRecordHouseKeepDays
    this.currentDateService = params.currentDateService

    this.timer = params.timer
  }

  async start() {
    return this.setUpTimer().then(() => {
      this.setUpListener()
    })
  }

  private async setUpTimer() {
    const timerConfig = await this.timerConfigStorageService.get()
    this.timer.setConfig(timerConfig)
    const backupState = await this.timerStateStorageService.get()
    if (backupState) {
      this.timer.setState(backupState)
    }

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
          newFocusSessionRecord(this.currentDateService.getDate())
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
            case WorkRequestName.TOGGLE_BROWSING_RULES: {
              this.browsingControlTogglingService.run()
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
                this.badgeDisplayService.clearBadge()
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
