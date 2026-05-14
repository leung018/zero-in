package expo.modules.appblocker

import android.app.AlarmManager
import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.PowerManager
import android.os.Process
import android.provider.Settings
import androidx.core.content.ContextCompat
import androidx.core.net.toUri

fun Context.hasOverlayPermission(): Boolean = Settings.canDrawOverlays(this)

fun Context.hasUsageStatsPermission(): Boolean {
  val appOps = getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
  val mode =
    appOps.checkOpNoThrow(
      AppOpsManager.OPSTR_GET_USAGE_STATS,
      Process.myUid(),
      packageName,
    )
  return mode == AppOpsManager.MODE_ALLOWED
}

fun Context.requestOverlayPermission() {
  val intent =
    Intent(
      Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
      "package:$packageName".toUri(),
    )
  intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
  startActivity(intent)
}

fun Context.requestUsageStatsPermission() {
  val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS, "package:$packageName".toUri())
  intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
  startActivity(intent)
}

fun Context.hasExactAlarmPermission(): Boolean {
  if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
  val alarmManager = getSystemService(Context.ALARM_SERVICE) as AlarmManager
  return alarmManager.canScheduleExactAlarms()
}

fun Context.requestExactAlarmPermission() {
  if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return
  val intent =
    Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, "package:$packageName".toUri()).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
  startActivity(intent)
}

fun Context.hasIgnoreBatteryOptimizationsPermission(): Boolean {
  val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
  return powerManager.isIgnoringBatteryOptimizations(packageName)
}

fun Context.requestIgnoreBatteryOptimizationsPermission() {
  val intent =
    Intent(
      Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
      "package:$packageName".toUri(),
    ).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
  startActivity(intent)
}

fun Context.startBlockingService() {
  val intent = Intent(this, BlockingService::class.java)
  ContextCompat.startForegroundService(this, intent)
}

fun Context.stopBlockingService() {
  val intent = Intent(this, BlockingService::class.java)
  stopService(intent)
}
