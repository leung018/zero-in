package expo.modules.appblocker

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.os.Process
import android.provider.Settings
import android.util.Log
import androidx.core.content.ContextCompat
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

    if (!hasOverlayPermission(applicationContext) || !hasUsageStatsPermission(applicationContext)) {
      Log.w(TAG, "Skipping scheduled start due to missing permissions")
      return Result.success()
    }

    val intent = Intent(applicationContext, BlockingService::class.java)
    ContextCompat.startForegroundService(applicationContext, intent)
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

    val intent = Intent(applicationContext, BlockingService::class.java)
    applicationContext.stopService(intent)
    return Result.success()
  }
}

private fun hasOverlayPermission(context: Context): Boolean = Settings.canDrawOverlays(context)

private fun hasUsageStatsPermission(context: Context): Boolean {
  val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
  val mode =
    appOps.checkOpNoThrow(
      AppOpsManager.OPSTR_GET_USAGE_STATS,
      Process.myUid(),
      context.packageName,
    )
  return mode == AppOpsManager.MODE_ALLOWED
}
