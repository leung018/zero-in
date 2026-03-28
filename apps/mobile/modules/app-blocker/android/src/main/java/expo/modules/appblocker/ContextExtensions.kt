package expo.modules.appblocker

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
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
  val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
  intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
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
