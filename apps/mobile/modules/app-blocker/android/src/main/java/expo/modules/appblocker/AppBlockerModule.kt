package expo.modules.appblocker

import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

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
          "exactAlarm" to context.hasExactAlarmPermission(),
        )
      }

      AsyncFunction("requestPermission") { permissionType: String ->
        val context = appContext.reactContext ?: throw Exception("No context")
        when (permissionType) {
          "overlay" -> context.requestOverlayPermission()
          "usageStats" -> context.requestUsageStatsPermission()
          "exactAlarm" -> context.requestExactAlarmPermission()
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
        if (!context.hasOverlayPermission() || !context.hasUsageStatsPermission() ||
          !context.hasExactAlarmPermission()
        ) {
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
        scheduleAlarms(
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
        cancelAlarms(context)
        preferences(context).clearScheduleWindow()
        context.stopBlockingService()
      }
    }

  private fun preferences(context: Context): BlockedAppsPreferences =
    BlockedAppsPreferences(context.applicationContext)
}
