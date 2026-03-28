package expo.modules.appblocker

import android.content.Context
import android.util.Log
import androidx.work.Worker
import androidx.work.WorkerParameters

internal const val SCHEDULE_START_WORK_NAME = "app_blocker_schedule_start"
internal const val SCHEDULE_END_WORK_NAME = "app_blocker_schedule_end"

private const val TAG = "AppBlockerSchedule"

class StartBlockingWorker(
  appContext: Context,
  workerParameters: WorkerParameters,
) : Worker(appContext, workerParameters) {
  override fun doWork(): Result {
    val preferences = BlockedAppsPreferences(applicationContext)
    val schedule = preferences.loadScheduleWindow() ?: return Result.success()

    val now = System.currentTimeMillis()
    if (now < schedule.startTimeMillis || now >= schedule.endTimeMillis) {
      return Result.success()
    }

    if (!applicationContext.hasOverlayPermission() ||
      !applicationContext.hasUsageStatsPermission()
    ) {
      Log.w(TAG, "Skipping scheduled start due to missing permissions")
      return Result.success()
    }

    applicationContext.startBlockingService()
    return Result.success()
  }
}

class EndBlockingWorker(
  appContext: Context,
  workerParameters: WorkerParameters,
) : Worker(appContext, workerParameters) {
  override fun doWork(): Result {
    val preferences = BlockedAppsPreferences(applicationContext)
    preferences.clearScheduleWindow()

    applicationContext.stopBlockingService()
    return Result.success()
  }
}
