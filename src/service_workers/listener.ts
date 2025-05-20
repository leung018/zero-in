import config from '../config'
import { BlockingTimerIntegrationStorageService } from '../domain/blocking_timer_integration/storage'
import { BrowsingControlTogglingService } from '../domain/browsing_control_toggling'
import { BrowsingRulesStorageService } from '../domain/browsing_rules/storage'
import { NotificationSettingStorageService } from '../domain/notification_setting/storage'
import { WeeklyScheduleStorageService } from '../domain/schedules/storage'
import { FocusTimer } from '../domain/timer'
import { TimerConfigStorageService } from '../domain/timer/config/storage'
import { newFocusSessionRecord } from '../domain/timer/record'
import { FocusSessionRecordHousekeeper } from '../domain/timer/record/house_keep'
import { FocusSessionRecordStorageService } from '../domain/timer/record/storage'
import { TimerStage } from '../domain/timer/stage'
import type { TimerState } from '../domain/timer/state'
import { TimerStateStorageService } from '../domain/timer/state/storage'
import { type ActionService } from '../infra/action'
import { type BadgeColor, type BadgeDisplayService } from '../infra/badge'
import { ChromeBadgeDisplayService } from '../infra/browser/badge'
import { ChromeBrowsingControlService } from '../infra/browser/browsing_control'
import { ChromeCloseTabsService } from '../infra/browser/close_tabs'
import { ChromeCommunicationManager } from '../infra/browser/communication'
import { ChromeNewTabService } from '../infra/browser/new_tab'
import { ChromeSoundService } from '../infra/browser/sound'
import type { BrowsingControlService } from '../infra/browsing_control'
import { type CommunicationManager, type Port } from '../infra/communication'
import { CurrentDateService } from '../infra/current_date'
import { DesktopNotificationService } from '../infra/desktop_notification'
import { MultipleActionService } from '../infra/multiple_actions'
import { SubscriptionManager } from '../utils/subscription'
import { WorkRequestName, type WorkRequest } from './request'
import { WorkResponseName, type WorkResponse } from './response'

type ListenerParams = {
  communicationManager: CommunicationManager
  reminderTabService: ActionService
  desktopNotificationService: DesktopNotificationService
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
  timer: FocusTimer
}

export type ClientPort = Port<WorkRequest, WorkResponse>
export class BackgroundListener {
  static create() {
    return new BackgroundListener({
      communicationManager: new ChromeCommunicationManager(),
      reminderTabService: new ChromeNewTabService(config.getReminderPageUrl()),
      desktopNotificationService: DesktopNotificationService.create(),
      soundService: new ChromeSoundService(),
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
      timer: FocusTimer.create()
    })
  }

  static createFake(params: ListenerParams) {
    return new BackgroundListener(params)
  }

  private browsingControlTogglingService: BrowsingControlTogglingService
  private browsingRulesStorageService: BrowsingRulesStorageService

  private communicationManager: CommunicationManager
  private timer: FocusTimer
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
  private desktopNotificationService: DesktopNotificationService
  private reminderTabService: ActionService

  private constructor(params: ListenerParams) {
    this.communicationManager = params.communicationManager
    this.browsingControlTogglingService = new BrowsingControlTogglingService({
      browsingControlService: params.browsingControlService,
      browsingRulesStorageService: params.browsingRulesStorageService,
      weeklyScheduleStorageService: params.weeklyScheduleStorageService,
      blockingTimerIntegrationStorageService: params.blockingTimerIntegrationStorageService,
      focusSessionRecordStorageService: params.focusSessionRecordStorageService,
      timerInfoGetter: {
        getTimerInfo: () => {
          const timerState = params.timer.getState()
          const timerConfig = params.timer.getConfig()
          return {
            timerStage: timerState.stage,
            isRunning: timerState.isRunning,
            remaining: timerState.remaining,
            longBreak: timerConfig.longBreakDuration,
            shortBreak: timerConfig.shortBreakDuration
          }
        }
      },
      currentDateService: params.currentDateService
    })
    this.browsingRulesStorageService = params.browsingRulesStorageService

    this.notificationService = new MultipleActionService([])
    this.notificationSettingStorageService = params.notificationSettingStorageService
    this.soundService = params.soundService
    this.desktopNotificationService = params.desktopNotificationService
    this.desktopNotificationService.setOnClickStartNext(() => {
      params.timer.start()
    })

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

      if (completedStage === TimerStage.FOCUS) {
        this.updateFocusSessionRecords()
      }
    })

    this.timer.setOnTimerUpdate((newState) => {
      this.timerStateStorageService.save(newState)
      this.timerStateSubscriptionManager.broadcast(newState)

      if (newState.isRunning) {
        this.badgeDisplayService.displayBadge({
          text: roundUpToRemainingMinutes(newState.remaining.remainingSeconds()).toString(),
          color: getBadgeColor(newState.stage)
        })
      }
    })

    this.timer.setOnTimerStart(() => {
      this.closeTabsService.trigger()
      this.toggleBrowsingRules()
      this.desktopNotificationService.clear()
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

  addBlockedDomain(domain: string) {
    return this.browsingRulesStorageService
      .get()
      .then((browsingRules) => {
        const newBrowsingRules = browsingRules.withNewBlockedDomain(domain)
        return this.browsingRulesStorageService.save(newBrowsingRules)
      })
      .then(() => {
        this.toggleBrowsingRules()
      })
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
                  payload: {
                    remainingSeconds: newState.remaining.remainingSeconds(),
                    isRunning: newState.isRunning,
                    stage: newState.stage,
                    focusSessionsCompleted: newState.focusSessionsCompleted
                  }
                })
              })
              this.timerStateSubscriptionManager.broadcast(this.timer.getState())
              backgroundPort.onDisconnect(() => {
                console.debug('Connection closed, unsubscribing timer update.')
                this.timerStateSubscriptionManager.unsubscribe(subscriptionId)
              })
              break
            }
            case WorkRequestName.LISTEN_TO_FOCUS_SESSION_RECORDS_UPDATE: {
              const subscriptionId = this.focusSessionRecordsUpdateSubscriptionManager.subscribe(
                () => {
                  backgroundPort.send({
                    name: WorkResponseName.FOCUS_SESSION_RECORDS_UPDATED
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

function getBadgeColor(stage: TimerStage): BadgeColor {
  const colorConfig = config.getBadgeColorConfig()
  if (stage === TimerStage.FOCUS) {
    return colorConfig.focusBadgeColor
  } else {
    return colorConfig.breakBadgeColor
  }
}
