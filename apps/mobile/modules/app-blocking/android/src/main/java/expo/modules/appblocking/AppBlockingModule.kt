package expo.modules.appblocking

import android.app.AppOpsManager
import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.Build
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.TimeUnit

class AppBlockingModule : Module() {
  private var allowedPackages = mutableSetOf<String>()
  
  private fun hasUsageStatsPermission(context: Context): Boolean {
    val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      appOps.unsafeCheckOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        context.packageName
      )
    } else {
      appOps.checkOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        context.packageName
      )
    }
    return mode == AppOpsManager.MODE_ALLOWED
  }

  override fun definition() = ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('AppBlocking')` in JavaScript.
    Name("AppBlocking")

    Events("onBlockedAppAttempt")

    AsyncFunction("requestUsageStatsPermission") {
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
      intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
      appContext.startActivity(intent)
    }

    AsyncFunction("getInstalledApps") {
      val pm = appContext.packageManager
      val apps = pm.getInstalledApplications(PackageManager.GET_META_DATA)
      apps.filter { app ->
        pm.getLaunchIntentForPackage(app.packageName) != null && 
        app.packageName != appContext.packageName
      }.map { app ->
        mapOf(
          "packageName" to app.packageName,
          "label" to pm.getApplicationLabel(app).toString(),
          "isSystemApp" to (app.flags and ApplicationInfo.FLAG_SYSTEM != 0)
        )
      }
    }

    AsyncFunction("setAllowedApps") { packages: List<String> ->
      allowedPackages.clear()
      allowedPackages.addAll(packages)
    }

    AsyncFunction("getAllowedApps") {
      allowedPackages.toList()
    }

    AsyncFunction("checkBlockedApps") {
      if (!hasUsageStatsPermission(appContext)) {
        throw Error("Usage Stats permission not granted")
      }

      val usageStatsManager = appContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
      val endTime = System.currentTimeMillis()
      val startTime = endTime - TimeUnit.MINUTES.toMillis(1)
      
      val stats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startTime, endTime)
      val recentApp = stats
        .filter { it.lastTimeUsed >= startTime }
        .maxByOrNull { it.lastTimeUsed }
        ?.packageName

      if (recentApp != null && !allowedPackages.contains(recentApp)) {
        sendEvent("onBlockedAppAttempt", mapOf(
          "packageName" to recentApp
        ))
      }
    }

    // Enables the module to be used as a native view. Definition components that are accepted as part of
    // the view definition: Prop, Events.
    View(AppBlockingView::class) {
      // Defines a setter for the `url` prop.
      Prop("url") { view: AppBlockingView, url: URL ->
        view.webView.loadUrl(url.toString())
      }
      // Defines an event that the view can send to JavaScript.
      Events("onLoad")
    }
  }
}
