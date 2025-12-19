package expo.modules.appblocker

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.os.Process
import android.provider.Settings
import androidx.core.net.toUri
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
}
