import { ChromeBadgeDisplayService } from '../chrome/badge'
import { ChromeBrowsingControlService } from '../chrome/browsing_control'
import { ChromeCloseTabsService } from '../chrome/close_tabs'
import { ChromeCommunicationManager } from '../chrome/communication'
import { ChromeNewTabService } from '../chrome/new_tab'
import { ChromeNotificationService } from '../chrome/notification'
import config from '../config'
import { type BrowsingControlService } from '../domain/browsing_control'
import { BrowsingRulesStorageService } from '../domain/browsing_rules/storage'
import { TimerConfigStorageService } from '../domain/pomodoro/config/storage'
import { FocusSessionRecordStorageService } from '../domain/pomodoro/record/storage'
import { TimerStateStorageService } from '../domain/pomodoro/storage'
import { WeeklyScheduleStorageService } from '../domain/schedules/storage'
import { type ActionService } from '../infra/action'
import { type BadgeDisplayService } from '../infra/badge'
import { type CommunicationManager } from '../infra/communication'
import { CurrentDateService } from '../infra/current_date'
import { MultipleActionService } from '../infra/multiple_actions'

export type ListenerServicesContext = {
  readonly communicationManager: CommunicationManager
  readonly reminderService: ActionService
  readonly badgeDisplayService: BadgeDisplayService
  readonly timerStateStorageService: TimerStateStorageService
  readonly timerConfigStorageService: TimerConfigStorageService
  readonly focusSessionRecordStorageService: FocusSessionRecordStorageService
  readonly closeTabsService: ActionService
  readonly browsingControlService: BrowsingControlService
  readonly browsingRulesStorageService: BrowsingRulesStorageService
  readonly weeklyScheduleStorageService: WeeklyScheduleStorageService
  readonly currentDateService: CurrentDateService
}

export class ListenerServicesContextImpl implements ListenerServicesContext {
  readonly communicationManager = new ChromeCommunicationManager()
  readonly reminderService = new MultipleActionService([
    new ChromeNewTabService(config.getReminderPageUrl()),
    new ChromeNotificationService()
  ])
  readonly badgeDisplayService = new ChromeBadgeDisplayService()
  readonly timerStateStorageService = TimerStateStorageService.create()
  readonly timerConfigStorageService = TimerConfigStorageService.create()
  readonly focusSessionRecordStorageService = FocusSessionRecordStorageService.create()
  readonly closeTabsService = new ChromeCloseTabsService(config.getReminderPageUrl())
  readonly browsingControlService = new ChromeBrowsingControlService()
  readonly browsingRulesStorageService = BrowsingRulesStorageService.create()
  readonly weeklyScheduleStorageService = WeeklyScheduleStorageService.create()
  readonly currentDateService = CurrentDateService.create()
}
