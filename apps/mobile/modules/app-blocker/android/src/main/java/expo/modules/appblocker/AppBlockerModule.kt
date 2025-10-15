package expo.modules.appblocker

import android.content.Context
import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AppBlockerModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("AppBlocker")

        View(AppPickerView::class) {}

        AsyncFunction("blockApps") {
            val context = appContext.reactContext ?: throw Exception("No context")

            if (!BlockingService.isServiceEnabled(context)) {
                throw Exception("Accessibility service not enabled. Please enable it in Settings.")
            }

            val prefs =
                context.getSharedPreferences(BlockingService.PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().apply {
                putBoolean(BlockingService.KEY_IS_BLOCKING, true)
                apply()
            }

            val intent = Intent(BlockingService.ACTION_RELOAD_PREFERENCES)
            context.sendBroadcast(intent)

            return@AsyncFunction true
        }

        AsyncFunction("unblockApps") {
            val context = appContext.reactContext ?: throw Exception("No context")

            val prefs =
                context.getSharedPreferences(BlockingService.PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().apply {
                putBoolean(BlockingService.KEY_IS_BLOCKING, false)
                apply()
            }

            val intent = Intent(BlockingService.ACTION_RELOAD_PREFERENCES)
            context.sendBroadcast(intent)

            return@AsyncFunction true
        }
    }
}
