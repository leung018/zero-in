import * as BackgroundTask from 'expo-background-task'
import * as TaskManager from 'expo-task-manager'
import { newAppBlockTogglingService } from '../factories'
import {
  cancelScheduledNotification,
  scheduleNotificationAtScheduleEnd
} from './notification-scheduler'

export const APP_BLOCK_TOGGLING_TASK = 'APP_BLOCK_TOGGLING_TASK'

/**
 * Define the background task.
 * This should be called at the root level of your application (e.g., in a separate file imported in _layout.tsx).
 */
TaskManager.defineTask(APP_BLOCK_TOGGLING_TASK, async () => {
  try {
    // Cancel any existing scheduled notification since periodic task is running
    await cancelScheduledNotification()

    const service = newAppBlockTogglingService()
    const scheduleSpan = await service.run()

    // Schedule next task at scheduleEnd if schedule exists
    if (scheduleSpan) {
      await scheduleNotificationAtScheduleEnd(scheduleSpan.end)
    }

    return BackgroundTask.BackgroundTaskResult.Success
  } catch (error) {
    console.error('[BackgroundTask] AppBlockTogglingTask failed:', error)
    return BackgroundTask.BackgroundTaskResult.Failed
  }
})

/**
 * Registers the background task to run periodically.
 */
export async function registerAppBlockTogglingTask() {
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

/**
 * Executes a synchronization run immediately and ensures the background task is registered.
 * Use this in UI triggers (like "Done" buttons or schedule updates).
 */
export async function triggerAppBlockTogglingSync() {
  // 1. Ensure the periodic background task is registered
  await registerAppBlockTogglingTask()

  // 2. Cancel any existing scheduled notification
  await cancelScheduledNotification()

  // 3. Run the logic immediately
  const service = newAppBlockTogglingService()
  const scheduleSpan = await service.run()

  // 4. Schedule next task at scheduleEnd if schedule exists
  if (scheduleSpan) {
    await scheduleNotificationAtScheduleEnd(scheduleSpan.end)
  }
}
