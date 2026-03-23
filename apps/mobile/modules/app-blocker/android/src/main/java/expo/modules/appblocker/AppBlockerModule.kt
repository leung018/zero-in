package expo.modules.appblocker

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.os.Process
import android.provider.Settings
import androidx.core.net.toUri
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.TimeUnit

class AppBlockerModule : Module() {
  override fun definition() =
    ModuleDefinition {
      Name("AppBlocker")

      View(AppPickerView::class) {
        Events("onAppsLoaded")
      }

      AsyncFunction("getPermissionDetails") {
        val context =
          appContext.reactContext ?: throw Exception("No context")
        return@AsyncFunction mapOf(
          "overlay" to hasOverlayPermission(context),
          "usageStats" to hasUsageStatsPermission(context),
        )
      }

      AsyncFunction("requestPermission") { permissionType: String ->
        val context = appContext.reactContext ?: throw Exception("No context")
        when (permissionType) {
          "overlay" -> requestOverlayPermission(context)
          "usageStats" -> requestUsageStatsPermission(context)
        }
      }

      AsyncFunction("blockApps") {
        val context = appContext.reactContext ?: throw Exception("No context")
        if (!hasOverlayPermission(context) || !hasUsageStatsPermission(context)) {
          throw Exception("Please enable the required permissions first")
        }
        startService()
      }

      AsyncFunction("unblockApps") {
        stopService()
      }

      AsyncFunction("setSchedule") { startTime: Double, endTime: Double ->
        val context = appContext.reactContext ?: throw Exception("No context")
        if (!hasOverlayPermission(context) || !hasUsageStatsPermission(context)) {
          throw Exception("Please enable the required permissions first")
        }

        val startTimeMillis = startTime.toLong()
        val endTimeMillis = endTime.toLong()
        if (startTimeMillis >= endTimeMillis) {
          throw Exception("Start time must be before end time")
        }

        val now = System.currentTimeMillis()
        if (endTimeMillis <= now) {
          throw Exception("End time must be in the future")
        }

        preferences(context).saveScheduleWindow(startTimeMillis, endTimeMillis)
        scheduleWorkers(
          context = context,
          startTimeMillis = startTimeMillis,
          endTimeMillis = endTimeMillis,
        )

        if (now in startTimeMillis until endTimeMillis) {
          startService()
        }
      }

      AsyncFunction("clearSchedule") {
        val context = appContext.reactContext ?: throw Exception("No context")
        cancelScheduleWorkers(context)
        preferences(context).clearScheduleWindow()
        stopService()
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

  private fun requestOverlayPermission(context: Context) {
    val intent =
      Intent(
        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
        ("package:" + context.packageName).toUri(),
      )
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(intent)
  }

  private fun requestUsageStatsPermission(context: Context) {
    val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(intent)
  }

  private fun startService() {
    val context = appContext.reactContext ?: throw Exception("No context")
    val intent = Intent(context, BlockingService::class.java)
    context.startService(intent)
  }

  private fun stopService() {
    val context = appContext.reactContext ?: throw Exception("No context")
    val intent = Intent(context, BlockingService::class.java)
    context.stopService(intent)
  }

  private fun preferences(context: Context): BlockedAppsPreferences =
    BlockedAppsPreferences(context.applicationContext)

  private fun scheduleWorkers(
    context: Context,
    startTimeMillis: Long,
    endTimeMillis: Long,
  ) {
    val workManager = WorkManager.getInstance(context.applicationContext)
    val now = System.currentTimeMillis()

    if (startTimeMillis > now) {
      val startDelayMillis = startTimeMillis - now
      val startRequest =
        OneTimeWorkRequestBuilder<StartBlockingWorker>()
          .setInitialDelay(startDelayMillis, TimeUnit.MILLISECONDS)
          .build()

      workManager.enqueueUniqueWork(
        SCHEDULE_START_WORK_NAME,
        ExistingWorkPolicy.REPLACE,
        startRequest,
      )
    } else {
      workManager.cancelUniqueWork(SCHEDULE_START_WORK_NAME)
    }

    val endDelayMillis = (endTimeMillis - now).coerceAtLeast(0L)
    val endRequest =
      OneTimeWorkRequestBuilder<EndBlockingWorker>()
        .setInitialDelay(endDelayMillis, TimeUnit.MILLISECONDS)
        .build()

    workManager.enqueueUniqueWork(
      SCHEDULE_END_WORK_NAME,
      ExistingWorkPolicy.REPLACE,
      endRequest,
    )
  }

  private fun cancelScheduleWorkers(context: Context) {
    val workManager = WorkManager.getInstance(context.applicationContext)
    workManager.cancelUniqueWork(SCHEDULE_START_WORK_NAME)
    workManager.cancelUniqueWork(SCHEDULE_END_WORK_NAME)
  }
}
