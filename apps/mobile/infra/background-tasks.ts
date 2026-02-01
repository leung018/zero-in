import * as BackgroundTask from 'expo-background-task'
import * as TaskManager from 'expo-task-manager'
import { newAppBlockTogglingService } from '../factories'
import {
  cancelScheduledNotification,
  scheduleNotificationAtScheduleEnd
} from './notification-scheduler'

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
