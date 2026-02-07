import * as Notifications from 'expo-notifications'

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
