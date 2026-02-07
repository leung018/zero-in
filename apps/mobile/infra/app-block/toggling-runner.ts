import * as BackgroundTask from 'expo-background-task'
import * as Notifications from 'expo-notifications'
import * as TaskManager from 'expo-task-manager'
import { newAppBlockTogglingService } from '../../factories'
import { createLogger } from '../../utils/logger'

const log = createLogger('TogglingRunner')

/**
 * Executes a run of app block toggling immediately and ensures the background task is registered.
 */
export async function triggerAppBlockToggling() {
  log.debug('Triggering App Block Toggling Sync')

  await registerAppBlockTogglingTask()

  await triggerAppBlockTogglingImpl()
}

export const APP_BLOCK_TOGGLING_TASK = 'APP_BLOCK_TOGGLING_TASK'

TaskManager.defineTask(APP_BLOCK_TOGGLING_TASK, async () => {
  try {
    log.debug('Running AppBlockTogglingTask')

    await triggerAppBlockTogglingImpl()

    return BackgroundTask.BackgroundTaskResult.Success
  } catch (error) {
    log.error('AppBlockTogglingTask failed:', error)
    return BackgroundTask.BackgroundTaskResult.Failed
  }
})

/**
 * Registers the background task to run periodically.
 */
async function registerAppBlockTogglingTask() {
  try {
    const status = await BackgroundTask.getStatusAsync()
    if (status !== BackgroundTask.BackgroundTaskStatus.Available) {
      log.warn('Background tasks are not available on this device.')
      return
    }

    await BackgroundTask.registerTaskAsync(APP_BLOCK_TOGGLING_TASK, {
      minimumInterval: 15 // minutes
    })
  } catch (error) {
    log.error('Failed to register task:', error)
  }
}

async function triggerAppBlockTogglingImpl() {
  await cancelScheduledNotification()

  const service = newAppBlockTogglingService()
  const scheduleSpan = await service.run()

  if (scheduleSpan) {
    await scheduleNotificationAtScheduleEnd(scheduleSpan.end)
  }
}

/**
 * Identifier used to track the scheduled notification for app blocking schedule end.
 * This allows us to cancel it without needing persistent storage.
 */
const APP_BLOCK_SCHEDULE_END_NOTIFICATION_ID = 'app-block-toggling-schedule-end'

/**
 * Schedules a notification at the specified date to trigger app blocking service.
 * Cancels any previously scheduled notification with the same identifier.
 *
 * @param scheduleEndDate - The date when the notification should fire (typically scheduleSpan.end)
 */
export async function scheduleNotificationAtScheduleEnd(scheduleEndDate: Date): Promise<void> {
  try {
    // Cancel any existing scheduled notification first
    await cancelScheduledNotification()

    // Schedule visible notification at the specified time
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Blocking Schedule Ended',
        body: 'Tap to let your app load your next blocking schedule',
        data: {
          identifier: APP_BLOCK_SCHEDULE_END_NOTIFICATION_ID
        }
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: scheduleEndDate
      }
    })

    log.debug('Scheduled notification at', scheduleEndDate.toISOString())
  } catch (error) {
    log.error('Failed to schedule notification:', error)
  }
}

export async function onScheduleEndNotificationTapped(
  response: Notifications.NotificationResponse
) {
  const identifier = response.notification.request.identifier
  if (identifier === APP_BLOCK_SCHEDULE_END_NOTIFICATION_ID) {
    log.debug('Schedule end notification tapped, triggering sync')
    await triggerAppBlockToggling()
  }
}

/**
 * Cancels any scheduled notifications for app blocking schedule end.
 * Uses getAllScheduledNotificationsAsync to find notifications by identifier.
 */
async function cancelScheduledNotification(): Promise<void> {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync()

    for (const notification of scheduledNotifications) {
      const identifier = notification.content.data?.identifier
      if (identifier === APP_BLOCK_SCHEDULE_END_NOTIFICATION_ID) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier)
        log.debug('Cancelled scheduled notification:', notification.identifier)
      }
    }
  } catch (error) {
    log.error('Failed to cancel scheduled notification:', error)
  }
}
