import * as Notifications from 'expo-notifications'
import * as TaskManager from 'expo-task-manager'
import { Alert } from 'react-native'
import { createLogger } from '../../utils/logger'
import { triggerAppBlockToggling } from '../app-block/toggling-runner'
import { extractNotificationTaskPayload } from './notification-task-payload'

const log = createLogger('BackgroundNotificationTask')

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK'

TaskManager.defineTask(
  BACKGROUND_NOTIFICATION_TASK,
  async ({ data, error }: TaskManager.TaskManagerTaskBody) => {
    if (error) {
      log.error('Background notification task error:', error)
      return
    }
    const payload = extractNotificationTaskPayload(data)
    if (payload?.kind === 'app-block-sync') {
      log.debug('Received app-block-sync push, triggering sync')
      await triggerAppBlockToggling()
      await dismissAppBlockSyncNotifications()
    }
  }
)

/**
 * On iOS the push also shows an alert in case the silent part is throttled. Once synced here, the
 * alert is no longer needed.
 */
async function dismissAppBlockSyncNotifications(): Promise<void> {
  try {
    const presented = await Notifications.getPresentedNotificationsAsync()
    for (const notification of presented) {
      if (notification.request.content.data?.kind === 'app-block-sync') {
        await Notifications.dismissNotificationAsync(notification.request.identifier)
        log.debug('Dismissed app-block-sync notification:', notification.request.identifier)
      }
    }
  } catch (error) {
    log.error('Failed to dismiss app-block-sync notifications:', error)
  }
}

// Only iOS shows app-block-sync notifications, so the alerts below are iOS-specific.
export async function onAppBlockSyncNotificationTapped(
  response: Notifications.NotificationResponse
): Promise<void> {
  if (response.notification.request.content.data?.kind !== 'app-block-sync') return

  log.debug('App-block-sync notification tapped, triggering sync')
  await triggerAppBlockToggling()
  Alert.alert(
    'Blocking Updated',
    'Your latest blocking settings are now active. You can swipe up to return home.',
    [{ text: 'OK' }]
  )
}

export async function registerBackgroundNotificationTask(): Promise<void> {
  await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK)
}
