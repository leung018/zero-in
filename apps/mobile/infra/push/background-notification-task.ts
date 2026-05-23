import * as Notifications from 'expo-notifications'
import * as TaskManager from 'expo-task-manager'
import { createLogger } from '../../utils/logger'
import { triggerAppBlockToggling } from '../app-block/toggling-runner'

const log = createLogger('BackgroundNotificationTask')

export const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK'

TaskManager.defineTask(
  BACKGROUND_NOTIFICATION_TASK,
  async ({ data, error }: TaskManager.TaskManagerTaskBody) => {
    if (error) {
      log.error('Background notification task error:', error)
      return
    }
    const payload: any = (data as any)?.notification?.data ?? (data as any)?.data
    if (payload?.kind === 'app-block-sync') {
      log.debug('Received app-block-sync push, triggering sync')
      await triggerAppBlockToggling()
    }
  }
)

export async function registerBackgroundNotificationTask(): Promise<void> {
  await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK)
}
