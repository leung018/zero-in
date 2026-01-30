import * as Notifications from 'expo-notifications'

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
export async function scheduleTaskAtScheduleEnd(scheduleEndDate: Date): Promise<void> {
  try {
    // Cancel any existing scheduled notification first
    await cancelScheduledTask()

    // Schedule visible notification at the specified time
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Next Schedule Ready',
        body: 'Tap to prepare your next blocking schedule',
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

    console.log('[NotificationScheduler] Scheduled task at', scheduleEndDate.toISOString())
  } catch (error) {
    console.error('[NotificationScheduler] Failed to schedule task:', error)
  }
}

/**
 * Cancels any scheduled notifications for app blocking schedule end.
 * Uses getAllScheduledNotificationsAsync to find notifications by identifier.
 */
export async function cancelScheduledTask(): Promise<void> {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync()

    for (const notification of scheduledNotifications) {
      const identifier = notification.content.data?.identifier
      if (identifier === APP_BLOCK_SCHEDULE_END_NOTIFICATION_ID) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier)
        console.log('[NotificationScheduler] Cancelled scheduled task:', notification.identifier)
      }
    }
  } catch (error) {
    console.error('[NotificationScheduler] Failed to cancel scheduled task:', error)
  }
}

/**
 * Requests notification permissions from the user.
 * Should be called at app startup.
 *
 * @returns true if permissions were granted, false otherwise
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      console.warn('[NotificationScheduler] Notification permissions not granted')
      return false
    }

    return true
  } catch (error) {
    console.error('[NotificationScheduler] Failed to request permissions:', error)
    return false
  }
}
