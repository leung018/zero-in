import config from '../config'
import { BrowsingControlTogglingService } from '../domain/browsing_control_toggling'
import { BrowsingRulesStorageService } from '../domain/browsing_rules/storage'
import { NotificationSettingStorageService } from '../domain/notification_setting/storage'
import { WeeklySchedulesStorageService } from '../domain/schedules/storage'
import { FocusTimer } from '../domain/timer'
import { TimerConfigStorageService } from '../domain/timer/config/storage'
import { newFocusSessionRecord } from '../domain/timer/record'
import { FocusSessionRecordHousekeeper } from '../domain/timer/record/house_keep'
import { FocusSessionRecordsStorageService } from '../domain/timer/record/storage'
import { TimerStage } from '../domain/timer/stage'
import { StageDisplayLabelHelper } from '../domain/timer/stage_display_label'
import type { TimerExternalState } from '../domain/timer/state/external'
import { TimerStateStorageService } from '../domain/timer/state/storage'
import { TimerBasedBlockingRulesStorageService } from '../domain/timer_based_blocking/storage'
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
import { newTimerConfig, WorkRequestName, type WorkRequest } from './request'
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
  focusSessionRecordsStorageService: FocusSessionRecordsStorageService
  closeTabsService: ActionService
  browsingControlService: BrowsingControlService
  browsingRulesStorageService: BrowsingRulesStorageService
  weeklySchedulesStorageService: WeeklySchedulesStorageService
  timerBasedBlockingRulesStorageService: TimerBasedBlockingRulesStorageService
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
      focusSessionRecordsStorageService: FocusSessionRecordsStorageService.create(),
      closeTabsService: new BrowserCloseTabsService(config.getReminderPageUrl()),
      browsingControlService: new BrowserBrowsingControlService(),
      browsingRulesStorageService: BrowsingRulesStorageService.create(),
      weeklySchedulesStorageService: WeeklySchedulesStorageService.create(),
      timerBasedBlockingRulesStorageService: TimerBasedBlockingRulesStorageService.create(),
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

  private focusSessionRecordsStorageService: FocusSessionRecordsStorageService
  private focusSessionRecordHouseKeepDays: number

  private notificationServicesContainer: ActionService
  private notificationSettingStorageService: NotificationSettingStorageService
  private soundService: ActionService
  private desktopNotificationService: DesktopNotificationService
  private reminderTabService: ActionService

  private isSettingUpTimer = false

  private constructor(params: ListenerParams) {
    this.communicationManager = params.communicationManager
    this.browsingControlTogglingService = new BrowsingControlTogglingService({
      browsingControlService: params.browsingControlService,
      browsingRulesStorageService: params.browsingRulesStorageService,
      weeklySchedulesStorageService: params.weeklySchedulesStorageService,
      timerBasedBlockingRulesStorageService: params.timerBasedBlockingRulesStorageService,
      focusSessionRecordsStorageService: params.focusSessionRecordsStorageService,
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
    this.focusSessionRecordsStorageService = params.focusSessionRecordsStorageService
    this.focusSessionRecordHouseKeepDays = params.focusSessionRecordHouseKeepDays

    this.timer = params.timer
  }

  async start() {
    await Promise.all([this.setUpTimer(), this.setUpNotification()])
    this.setUpPortListening()
  }

  async reload() {
    this.timerStateStorageService.unsubscribeAll()
    this.timerConfigStorageService.unsubscribeAll()
    this.badgeDisplayService.clearBadge()

    await Promise.all([this.reloadTimer(), this.setUpNotification()])
    await this.toggleBrowsingRules() // toggleBrowsingRules should call after timer is set
  }

  private async reloadTimer() {
    this.removeTimerSubscriptions()

    const timerConfig = await this.timerConfigStorageService.get()
    this.timer.setConfig(timerConfig)
    const backupInternalState = await this.timerStateStorageService.get()
    if (backupInternalState) {
      this.timer.setInternalState(backupInternalState)
    }

    await this.setupTimerSubscriptions()
  }

  /**
   * Note: Can't call this method in reload.
   * Because setConfigAndResetState will corrupt the backupInternalState who are subscribing it.
   */
  private async setUpTimer() {
    const timerConfig = await this.timerConfigStorageService.get()
    this.timer.setConfigAndResetState(timerConfig)
    const backupInternalState = await this.timerStateStorageService.get()
    if (backupInternalState) {
      this.timer.setInternalState(backupInternalState)
    }

    this.timer.setOnStageCompleted(({ lastStage, lastSessionStartTime }) => {
      this.timerStateStorageService.save(this.timer.getInternalState())

      this.triggerNotification()
      this.badgeDisplayService.clearBadge()
      this.toggleBrowsingRules()

      if (lastStage === TimerStage.FOCUS) {
        this.updateFocusSessionRecords(lastSessionStartTime)
      }
    })

    // Use setOnTimerStart instead of putting these actions under START_TIMER to avoid duplication.
    // Restarting focus or break also need these actions.
    this.timer.setOnTimerStart(() => {
      this.timerStateStorageService.save(this.timer.getInternalState())
      this.closeTabsService.trigger()
      this.toggleBrowsingRules()
      this.desktopNotificationService.clear()
    })

    // See comments above. The reason of using setOnTimerPause is similar.
    this.timer.setOnTimerPause(() => {
      this.badgeDisplayService.clearBadge()
      this.toggleBrowsingRules()
      this.timerStateStorageService.save(this.timer.getInternalState())
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

    await this.setupTimerSubscriptions()
  }

  private removeTimerSubscriptions() {
    this.timerStateStorageService.unsubscribeAll()
    this.timerConfigStorageService.unsubscribeAll()
  }

  private async setupTimerSubscriptions() {
    await this.timerStateStorageService.onChange((newInternalState) => {
      if (
        newInternalState.timerId != this.timer.getId() &&
        !newInternalState.equalsIgnoringId(this.timer.getInternalState())
      ) {
        this.timer.setInternalState(newInternalState)
      }
    })
    await this.timerConfigStorageService.onChange((newConfig) => {
      this.timer.setConfig(newConfig)
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

  private async updateFocusSessionRecords(lastSessionStartTime: Date) {
    return this.focusSessionRecordsStorageService
      .get()
      .then((records) => {
        this.focusSessionRecordsStorageService.save([
          ...records,
          newFocusSessionRecord({
            startedAt: lastSessionStartTime
          })
        ])
      })
      .then(() => {
        FocusSessionRecordHousekeeper.houseKeep({
          focusSessionRecordsStorageService: this.focusSessionRecordsStorageService,
          houseKeepDays: this.focusSessionRecordHouseKeepDays
        })
      })
  }

  getTimerStateSubscriptionCount() {
    return this.timerStateSubscriptionManager.getSubscriptionCount()
  }

  getTimerExternalState() {
    return this.timer.getExternalState()
  }

  getTimerConfig() {
    return this.timer.getConfig()
  }

  async addBlockedDomain(domain: string) {
    return this.browsingRulesStorageService
      .get()
      .then((browsingRules) => {
        const newBrowsingRules = browsingRules.withNewBlockedDomain(domain)
        return this.browsingRulesStorageService.save(newBrowsingRules)
      })
      .then(() => {
        return this.toggleBrowsingRules()
      })
  }

  async toggleBrowsingRules() {
    return this.browsingControlTogglingService.run()
  }

  private setUpPortListening() {
    this.communicationManager.onNewClientConnect(
      (backgroundPort: Port<WorkResponse, WorkRequest>) => {
        this.setupTimerStateSubscription(backgroundPort)

        const listener = (message: WorkRequest) => {
          switch (message.name) {
            case WorkRequestName.TOGGLE_BROWSING_RULES: {
              this.toggleBrowsingRules()
              break
            }
            case WorkRequestName.QUERY_TIMER_STATE:
              this.timerStateSubscriptionManager.broadcast(this.timer.getExternalState())
              break
            case WorkRequestName.START_TIMER: {
              this.timer.start()
              break
            }
            case WorkRequestName.PAUSE_TIMER: {
              this.timer.pause()
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
              // Original implementation fetched timer config from storage to reset it,
              // but Firestore may return stale data causing bugs. Now we receive the
              // config directly in the payload to avoid this issue.
              const timerConfig = newTimerConfig(message.payload)
              this.timerConfigStorageService.save(timerConfig).then(() => {
                this.timer.setConfigAndResetState(timerConfig)
                backgroundPort.send({
                  name: WorkResponseName.RESET_TIMER_CONFIG_SUCCESS
                })
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

  private setupTimerStateSubscription(backgroundPort: Port<WorkResponse, WorkRequest>) {
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
