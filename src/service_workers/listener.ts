import { type WorkRequest, WorkRequestName } from './request'
import { type CommunicationManager, type Port } from '../infra/communication'
import { BrowsingControlTogglingService } from '../domain/browsing_control_toggling'
import { WorkResponseName, type WorkResponse } from './response'
import { PomodoroTimer } from '../domain/pomodoro/timer'
import { type ActionService } from '../infra/action'
import { type BadgeColor, type BadgeDisplayService } from '../infra/badge'
import { PomodoroStage } from '../domain/pomodoro/stage'
import config from '../config'
import { TimerStateStorageService } from '../domain/pomodoro/state/storage'
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
import { ChromeDesktopNotificationService } from '../chrome/notification'
import { ChromeBadgeDisplayService } from '../chrome/badge'
import { ChromeCloseTabsService } from '../chrome/close_tabs'
import { ChromeBrowsingControlService } from '../chrome/browsing_control'
import { SoundService } from '../chrome/sound'
import { NotificationSettingStorageService } from '../domain/notification_setting/storage'
import type { TimerState } from '../domain/pomodoro/state'
import { BlockingTimerIntegrationStorageService } from '../domain/blocking_timer_integration/storage'

type ListenerParams = {
  communicationManager: CommunicationManager
  reminderTabService: ActionService
  desktopNotificationService: ActionService
  soundService: ActionService
  notificationSettingStorageService: NotificationSettingStorageService
  badgeDisplayService: BadgeDisplayService
  timerStateStorageService: TimerStateStorageService
  timerConfigStorageService: TimerConfigStorageService
  focusSessionRecordStorageService: FocusSessionRecordStorageService
  closeTabsService: ActionService
  browsingControlService: BrowsingControlService
  browsingRulesStorageService: BrowsingRulesStorageService
  weeklyScheduleStorageService: WeeklyScheduleStorageService
  blockingTimerIntegrationStorageService: BlockingTimerIntegrationStorageService
  currentDateService: CurrentDateService
  focusSessionRecordHouseKeepDays: number
  timer: PomodoroTimer
}

export class BackgroundListener {
  static create() {
    return new BackgroundListener({
      communicationManager: new ChromeCommunicationManager(),
      reminderTabService: new ChromeNewTabService(config.getReminderPageUrl()),
      desktopNotificationService: new ChromeDesktopNotificationService(),
      soundService: new SoundService(),
      notificationSettingStorageService: NotificationSettingStorageService.create(),
      badgeDisplayService: new ChromeBadgeDisplayService(),
      timerStateStorageService: TimerStateStorageService.create(),
      timerConfigStorageService: TimerConfigStorageService.create(),
      focusSessionRecordStorageService: FocusSessionRecordStorageService.create(),
      closeTabsService: new ChromeCloseTabsService(config.getReminderPageUrl()),
      browsingControlService: new ChromeBrowsingControlService(),
      browsingRulesStorageService: BrowsingRulesStorageService.create(),
      weeklyScheduleStorageService: WeeklyScheduleStorageService.create(),
      currentDateService: CurrentDateService.create(),
      blockingTimerIntegrationStorageService: BlockingTimerIntegrationStorageService.create(),
      focusSessionRecordHouseKeepDays: config.getFocusSessionRecordHouseKeepDays(),
      timer: PomodoroTimer.create()
    })
  }

  static createFake(params: ListenerParams) {
    return new BackgroundListener(params)
  }

  private browsingControlTogglingService: BrowsingControlTogglingService
  private communicationManager: CommunicationManager
  private timer: PomodoroTimer
  private badgeDisplayService: BadgeDisplayService
  private timerStateStorageService: TimerStateStorageService
  private timerConfigStorageService: TimerConfigStorageService
  private closeTabsService: ActionService
  private currentDateService: CurrentDateService

  private timerStateSubscriptionManager = new SubscriptionManager<TimerState>()

  private focusSessionRecordStorageService: FocusSessionRecordStorageService
  private focusSessionRecordHouseKeepDays: number
  private focusSessionRecordsUpdateSubscriptionManager = new SubscriptionManager()

  private notificationService: ActionService
  private notificationSettingStorageService: NotificationSettingStorageService
  private soundService: ActionService
  private desktopNotificationService: ActionService
  private reminderTabService: ActionService

  private constructor(params: ListenerParams) {
    this.communicationManager = params.communicationManager
    this.browsingControlTogglingService = new BrowsingControlTogglingService({
      browsingControlService: params.browsingControlService,
      browsingRulesStorageService: params.browsingRulesStorageService,
      weeklyScheduleStorageService: params.weeklyScheduleStorageService,
      blockingTimerIntegrationStorageService: params.blockingTimerIntegrationStorageService,
      timerInfoGetter: {
        getTimerInfo: () => {
          const timerState = params.timer.getState()
          const timerConfig = params.timer.getConfig()
          return {
            timerStage: timerState.stage,
            isRunning: timerState.isRunning,
            remainingSeconds: timerState.remainingSeconds,
            longBreakSeconds: timerConfig.longBreakDuration.remainingSeconds(),
            shortBreakSeconds: timerConfig.shortBreakDuration.remainingSeconds()
          }
        }
      },
      currentDateService: params.currentDateService
    })

    this.notificationService = new MultipleActionService([])
    this.notificationSettingStorageService = params.notificationSettingStorageService
    this.soundService = params.soundService
    this.desktopNotificationService = params.desktopNotificationService
    this.reminderTabService = params.reminderTabService

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
    await Promise.all([this.setUpTimer(), this.setUpNotification()])
    this.setUpListener()
  }

  private async setUpTimer() {
    const timerConfig = await this.timerConfigStorageService.get()
    this.timer.setConfig(timerConfig)
    const backupState = await this.timerStateStorageService.get()
    if (backupState) {
      this.timer.setState(backupState)
    }

    this.timer.setOnStageComplete((completedStage) => {
      this.notificationService.trigger()
      this.badgeDisplayService.clearBadge()
      this.toggleBrowsingRules()

      if (completedStage === PomodoroStage.FOCUS) {
        this.updateFocusSessionRecords()
      }
    })

    this.timer.setOnTimerUpdate((newState) => {
      this.timerStateStorageService.save(newState)
      this.timerStateSubscriptionManager.broadcast(newState)

      if (newState.isRunning) {
        this.badgeDisplayService.displayBadge({
          text: roundUpToRemainingMinutes(newState.remainingSeconds).toString(),
          color: getBadgeColor(newState.stage)
        })
      }
    })
  }

  private async setUpNotification() {
    const notificationSetting = await this.notificationSettingStorageService.get()
    const services: ActionService[] = []

    if (notificationSetting.reminderTab) {
      services.push(this.reminderTabService)
    }
    if (notificationSetting.desktopNotification) {
      services.push(this.desktopNotificationService)
    }
    if (notificationSetting.sound) {
      services.push(this.soundService)
    }

    this.notificationService = new MultipleActionService(services)
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

  getTimerStateSubscriptionCount() {
    return this.timerStateSubscriptionManager.getSubscriptionCount()
  }

  getTimerState() {
    return this.timer.getState()
  }

  toggleBrowsingRules() {
    this.browsingControlTogglingService.run()
  }

  private setUpListener() {
    this.communicationManager.onNewClientConnect(
      (backgroundPort: Port<WorkResponse, WorkRequest>) => {
        const listener = (message: WorkRequest) => {
          switch (message.name) {
            case WorkRequestName.TOGGLE_BROWSING_RULES: {
              this.toggleBrowsingRules()
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
              const subscriptionId = this.timerStateSubscriptionManager.subscribe((newState) => {
                backgroundPort.send({
                  name: WorkResponseName.TIMER_STATE,
                  payload: newState
                })
              })
              this.timerStateSubscriptionManager.broadcast(this.timer.getState())
              backgroundPort.onDisconnect(() => {
                console.debug('Connection closed, unsubscribing timer update.')
                this.timerStateSubscriptionManager.unsubscribe(subscriptionId)
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
              this.closeTabsService.trigger()
              break
            }
            case WorkRequestName.RESTART_SHORT_BREAK: {
              this.timer.restartShortBreak(message.payload?.nth)
              this.closeTabsService.trigger()
              break
            }
            case WorkRequestName.RESTART_LONG_BREAK: {
              this.timer.restartLongBreak()
              this.closeTabsService.trigger()
              break
            }
            case WorkRequestName.RESET_TIMER_CONFIG: {
              this.timerConfigStorageService.get().then((config) => {
                this.timer.setConfig(config)
                this.badgeDisplayService.clearBadge()
              })
              break
            }
            case WorkRequestName.RESET_NOTIFICATION: {
              this.setUpNotification()
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
