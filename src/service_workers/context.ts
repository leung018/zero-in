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
  communicationManager: CommunicationManager
  reminderService: ActionService
  badgeDisplayService: BadgeDisplayService
  timerStateStorageService: TimerStateStorageService
  timerConfigStorageService: TimerConfigStorageService
  focusSessionRecordStorageService: FocusSessionRecordStorageService
  closeTabsService: ActionService
  browsingControlService: BrowsingControlService
  browsingRulesStorageService: BrowsingRulesStorageService
  weeklyScheduleStorageService: WeeklyScheduleStorageService
  currentDateService: CurrentDateService
}

export class ListenerServicesContextImpl implements ListenerServicesContext {
  communicationManager = new ChromeCommunicationManager()
  reminderService = new MultipleActionService([
    new ChromeNewTabService(config.getReminderPageUrl()),
    new ChromeNotificationService()
  ])
  badgeDisplayService = new ChromeBadgeDisplayService()
  timerStateStorageService = TimerStateStorageService.create()
  timerConfigStorageService = TimerConfigStorageService.create()
  focusSessionRecordStorageService = FocusSessionRecordStorageService.create()
  closeTabsService = new ChromeCloseTabsService(config.getReminderPageUrl())
  browsingControlService = new ChromeBrowsingControlService()
  browsingRulesStorageService = BrowsingRulesStorageService.create()
  weeklyScheduleStorageService = WeeklyScheduleStorageService.create()
  currentDateService = CurrentDateService.create()
}
