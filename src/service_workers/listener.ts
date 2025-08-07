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
import { StageDisplayLabelHelper } from '../domain/timer/stage_display_label'
import type { TimerExternalState } from '../domain/timer/state/external'
import { TimerStateStorageService } from '../domain/timer/state/storage'
import { type ActionService } from '../infra/action'
import { type BadgeColor, type BadgeDisplayService } from '../infra/badge'
import { BrowserBadgeDisplayService } from '../infra/browser/badge'
import { BrowserBrowsingControlService } from '../infra/browser/browsing_control'
import { BrowserCloseTabsService } from '../infra/browser/close_tabs'
import { BrowserCommunicationManager } from '../infra/browser/communication'
import { BrowserNewTabService } from '../infra/browser/new_tab'
import { BrowserSoundService } from '../infra/browser/sound'
import type { BrowsingControlService } from '../infra/browsing_control'
import { type CommunicationManager, type Port } from '../infra/communication'
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
  focusSessionRecordHouseKeepDays: number
  timer: FocusTimer
}

export type ClientPort = Port<WorkRequest, WorkResponse>
export class BackgroundListener {
  static create() {
    return new BackgroundListener({
      communicationManager: new BrowserCommunicationManager(),
      reminderTabService: new BrowserNewTabService(config.getReminderPageUrl()),
      desktopNotificationService: DesktopNotificationService.create(),
      soundService: new BrowserSoundService(),
      notificationSettingStorageService: NotificationSettingStorageService.create(),
      badgeDisplayService: new BrowserBadgeDisplayService(),
      timerStateStorageService: TimerStateStorageService.create(),
      timerConfigStorageService: TimerConfigStorageService.create(),
      focusSessionRecordStorageService: FocusSessionRecordStorageService.create(),
      closeTabsService: new BrowserCloseTabsService(config.getReminderPageUrl()),
      browsingControlService: new BrowserBrowsingControlService(),
      browsingRulesStorageService: BrowsingRulesStorageService.create(),
      weeklyScheduleStorageService: WeeklyScheduleStorageService.create(),
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

  private timerStateSubscriptionManager = new SubscriptionManager<TimerExternalState>()

  private focusSessionRecordStorageService: FocusSessionRecordStorageService
  private focusSessionRecordHouseKeepDays: number
  private focusSessionRecordsUpdateSubscriptionManager = new SubscriptionManager()

  private notificationServicesContainer: ActionService
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
          const timerState = params.timer.getExternalState()
          const timerConfig = params.timer.getConfig()
          return {
            timerStage: timerState.stage,
            isRunning: timerState.isRunning,
            remaining: timerState.remaining,
            longBreak: timerConfig.longBreakDuration,
            shortBreak: timerConfig.shortBreakDuration
          }
        }
      }
    })
    this.browsingRulesStorageService = params.browsingRulesStorageService

    this.notificationServicesContainer = new MultipleActionService([])
    this.notificationSettingStorageService = params.notificationSettingStorageService
    this.soundService = params.soundService
    this.desktopNotificationService = params.desktopNotificationService
    this.desktopNotificationService.setOnClickStart(() => {
      params.timer.start()
    })

    this.reminderTabService = params.reminderTabService

    this.badgeDisplayService = params.badgeDisplayService
    this.timerStateStorageService = params.timerStateStorageService
    this.timerConfigStorageService = params.timerConfigStorageService
    this.closeTabsService = params.closeTabsService
    this.focusSessionRecordStorageService = params.focusSessionRecordStorageService
    this.focusSessionRecordHouseKeepDays = params.focusSessionRecordHouseKeepDays

    this.timer = params.timer
  }

  async start() {
    await Promise.all([this.setUpTimer(), this.setUpNotification()])
    this.setUpListener()
  }

  private async setUpTimer() {
    const timerConfig = await this.timerConfigStorageService.get()
    this.timer.setConfig(timerConfig)
    const backupInternalState = await this.timerStateStorageService.get()
    if (backupInternalState) {
      this.timer.setInternalState(backupInternalState)
    }

    this.timer.setOnStageCompleted((lastStage) => {
      this.timerStateStorageService.save(this.timer.getInternalState())

      this.triggerNotification()
      this.badgeDisplayService.clearBadge()
      this.toggleBrowsingRules()

      if (lastStage === TimerStage.FOCUS) {
        this.updateFocusSessionRecords()
      }
    })

    this.timer.setOnTimerUpdate((newExternalState) => {
      this.timerStateSubscriptionManager.broadcast(newExternalState)

      if (newExternalState.isRunning) {
        this.badgeDisplayService.displayBadge({
          text: roundUpToRemainingMinutes(newExternalState.remaining.remainingSeconds()).toString(),
          color: getBadgeColor(newExternalState.stage)
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

    this.notificationServicesContainer = new MultipleActionService(services)
  }

  private triggerNotification() {
    const stageDisplayLabelHelper = new StageDisplayLabelHelper(this.timer.getConfig())
    const stageLabel = stageDisplayLabelHelper.getStageLabel(this.timer.getExternalState())
    this.desktopNotificationService.setNextButtonTitle(`Start ${stageLabel}`)

    this.notificationServicesContainer.trigger()
  }

  private async updateFocusSessionRecords() {
    return this.focusSessionRecordStorageService
      .getAll()
      .then((records) => {
        this.focusSessionRecordStorageService.saveAll([...records, newFocusSessionRecord()])
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

  getTimerExternalState() {
    return this.timer.getExternalState()
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
              this.timerStateStorageService.save(this.timer.getInternalState())
              this.closeTabsService.trigger()
              this.toggleBrowsingRules()
              this.desktopNotificationService.clear()
              break
            }
            case WorkRequestName.PAUSE_TIMER: {
              this.timer.pause()
              this.badgeDisplayService.clearBadge()
              this.toggleBrowsingRules()
              this.timerStateStorageService.save(this.timer.getInternalState())
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
                    focusSessionsCompleted: newState.focusSessionsCompleted,
                    focusSessionsPerCycle: this.timer.getConfig().focusSessionsPerCycle
                  }
                })
              })
              this.timerStateSubscriptionManager.broadcast(this.timer.getExternalState())
              backgroundPort.onDisconnect(() => {
                // To verify the disconnect and onDisconnect behavior of port in application, can uncomment below debug log.
                // And then see if the below log is printed when disconnect is triggered (e.g. closing timer popup will trigger disconnect)

                // console.debug('Connection closed, unsubscribing timer update.')
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
