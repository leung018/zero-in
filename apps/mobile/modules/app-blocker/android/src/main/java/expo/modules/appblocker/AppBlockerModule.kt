package expo.modules.appblocker

import android.content.Context
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
          "overlay" to context.hasOverlayPermission(),
          "usageStats" to context.hasUsageStatsPermission(),
        )
      }

      AsyncFunction("requestPermission") { permissionType: String ->
        val context = appContext.reactContext ?: throw Exception("No context")
        when (permissionType) {
          "overlay" -> context.requestOverlayPermission()
          "usageStats" -> context.requestUsageStatsPermission()
        }
      }

      AsyncFunction("blockApps") {
        val context = appContext.reactContext ?: throw Exception("No context")
        if (!context.hasOverlayPermission() || !context.hasUsageStatsPermission()) {
          throw Exception("Please enable the required permissions first")
        }
        context.startBlockingService()
      }

      AsyncFunction("unblockApps") {
        val context = appContext.reactContext ?: throw Exception("No context")
        context.stopBlockingService()
      }

      AsyncFunction("setSchedule") { startTime: Double, endTime: Double ->
        val context = appContext.reactContext ?: throw Exception("No context")
        if (!context.hasOverlayPermission() || !context.hasUsageStatsPermission()) {
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
          context.startBlockingService()
        }
      }

      AsyncFunction("clearSchedule") {
        val context = appContext.reactContext ?: throw Exception("No context")
        cancelScheduleWorkers(context)
        preferences(context).clearScheduleWindow()
        context.stopBlockingService()
      }
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
