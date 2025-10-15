package expo.modules.appblocker

import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AppBlockerModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("AppBlocker")

        View(AppPickerView::class) {
            Events("onSelectionChange")

            Prop("selectedApps") { view: AppPickerView, apps: List<String>? ->
                view.setSelectedApps(apps ?: emptyList())
            }
        }

        AsyncFunction("blockApps") { packageNames: List<String> ->
            val context = appContext.reactContext ?: throw Exception("No context")

            // Check if service is enabled
            if (!BlockingService.isServiceEnabled(context)) {
                throw Exception("Accessibility service not enabled. Please enable it in Settings.")
            }

            // Save blocked apps to SharedPreferences
            val prefs = context.getSharedPreferences("app_blocker_prefs", Context.MODE_PRIVATE)
            prefs.edit().apply {
                putStringSet("blocked_apps", packageNames.toSet())
                putBoolean("is_blocking", true)
                apply()
            }

            // Notify the service (it will reload from SharedPreferences)
            // The service automatically picks up changes when it detects app launches

            return@AsyncFunction true
        }
    }
}
