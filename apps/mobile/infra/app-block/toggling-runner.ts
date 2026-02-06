import * as BackgroundTask from 'expo-background-task'
import * as Notifications from 'expo-notifications'
import * as TaskManager from 'expo-task-manager'
import { newAppBlockTogglingService } from '../../factories'

/**
 * Executes a run of app block toggling immediately and ensures the background task is registered.
 */
export async function triggerAppBlockToggling() {
  console.debug('[BackgroundTask] Triggering App Block Toggling Sync')

  await registerAppBlockTogglingTask()

  await triggerAppBlockTogglingImpl()
}

const APP_BLOCK_TOGGLING_TASK = 'APP_BLOCK_TOGGLING_TASK'

TaskManager.defineTask(APP_BLOCK_TOGGLING_TASK, async () => {
  try {
    console.debug('[BackgroundTask] Running AppBlockTogglingTask')

    await triggerAppBlockTogglingImpl()

    return BackgroundTask.BackgroundTaskResult.Success
  } catch (error) {
    console.error('[BackgroundTask] AppBlockTogglingTask failed:', error)
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
      console.warn('[BackgroundTask] Background tasks are not available on this device.')
      return
    }

    await BackgroundTask.registerTaskAsync(APP_BLOCK_TOGGLING_TASK, {
      minimumInterval: 15 // minutes
    })
  } catch (error) {
    console.error('[BackgroundTask] Failed to register task:', error)
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
async function scheduleNotificationAtScheduleEnd(scheduleEndDate: Date): Promise<void> {
  try {
    // Cancel any existing scheduled notification first
    await cancelScheduledNotification()

    // Schedule visible notification at the specified time
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Blocking Schedule Ended',
        body: 'Tap to let your app load your next blocking schedule',
        data: {
          identifier: APP_BLOCK_SCHEDULE_END_NOTIFICATION_ID,
          triggerSource: 'schedule-end'
        }
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: scheduleEndDate
      }
    })

    console.log('[NotificationScheduler] Scheduled notification at', scheduleEndDate.toISOString())
  } catch (error) {
    console.error('[NotificationScheduler] Failed to schedule notification:', error)
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
        console.log(
          '[NotificationScheduler] Cancelled scheduled notification:',
          notification.identifier
        )
      }
    }
  } catch (error) {
    console.error('[NotificationScheduler] Failed to cancel scheduled notification:', error)
  }
}
