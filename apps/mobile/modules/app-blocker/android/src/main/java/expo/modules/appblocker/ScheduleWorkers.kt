package expo.modules.appblocker

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

private const val TAG = "AppBlockerSchedule"
private const val ACTION_START_BLOCKING = "expo.modules.appblocker.ACTION_START_BLOCKING"
private const val ACTION_END_BLOCKING = "expo.modules.appblocker.ACTION_END_BLOCKING"
private const val REQUEST_CODE_START = 1001
private const val REQUEST_CODE_END = 1002

class StartBlockingReceiver : BroadcastReceiver() {
  override fun onReceive(
    context: Context,
    intent: Intent,
  ) {
    val preferences = BlockedAppsPreferences(context)
    val schedule = preferences.loadScheduleWindow() ?: return

    val now = System.currentTimeMillis()
    if (now < schedule.startTimeMillis || now >= schedule.endTimeMillis) {
      return
    }

    if (!context.hasOverlayPermission() || !context.hasUsageStatsPermission()) {
      Log.w(TAG, "Skipping scheduled start due to missing permissions")
      return
    }

    context.startBlockingService()
  }
}

class EndBlockingReceiver : BroadcastReceiver() {
  override fun onReceive(
    context: Context,
    intent: Intent,
  ) {
    BlockedAppsPreferences(context).clearScheduleWindow()
    context.stopBlockingService()
  }
}

class BootReceiver : BroadcastReceiver() {
  override fun onReceive(
    context: Context,
    intent: Intent,
  ) {
    if (intent.action != Intent.ACTION_BOOT_COMPLETED) return

    val preferences = BlockedAppsPreferences(context)
    val schedule = preferences.loadScheduleWindow() ?: return

    val now = System.currentTimeMillis()
    if (schedule.endTimeMillis <= now) {
      preferences.clearScheduleWindow()
      return
    }

    if (!context.hasExactAlarmPermission()) return

    scheduleAlarms(context, schedule.startTimeMillis, schedule.endTimeMillis)

    if (now in schedule.startTimeMillis until schedule.endTimeMillis) {
      if (context.hasOverlayPermission() && context.hasUsageStatsPermission()) {
        context.startBlockingService()
      }
    }
  }
}

internal fun scheduleAlarms(
  context: Context,
  startTimeMillis: Long,
  endTimeMillis: Long,
) {
  val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
  val now = System.currentTimeMillis()

  val updateFlags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE

  if (startTimeMillis > now) {
    alarmManager.setExactAndAllowWhileIdle(
      AlarmManager.RTC_WAKEUP,
      startTimeMillis,
      startPendingIntent(context, updateFlags)!!,
    )
  }

  alarmManager.setExactAndAllowWhileIdle(
    AlarmManager.RTC_WAKEUP,
    endTimeMillis,
    endPendingIntent(context, updateFlags)!!,
  )
}

internal fun cancelAlarms(context: Context) {
  val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

  startPendingIntent(context, PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE)
    ?.let { alarmManager.cancel(it) }

  endPendingIntent(context, PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE)
    ?.let { alarmManager.cancel(it) }
}

private fun startPendingIntent(
  context: Context,
  flags: Int,
): PendingIntent? =
  PendingIntent.getBroadcast(
    context,
    REQUEST_CODE_START,
    Intent(context, StartBlockingReceiver::class.java).apply { action = ACTION_START_BLOCKING },
    flags,
  )

private fun endPendingIntent(
  context: Context,
  flags: Int,
): PendingIntent? =
  PendingIntent.getBroadcast(
    context,
    REQUEST_CODE_END,
    Intent(context, EndBlockingReceiver::class.java).apply { action = ACTION_END_BLOCKING },
    flags,
  )
