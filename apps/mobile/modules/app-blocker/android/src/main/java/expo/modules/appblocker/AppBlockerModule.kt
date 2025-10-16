package expo.modules.appblocker

import android.content.Context
import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AppBlockerModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("AppBlocker")

        View(AppPickerView::class) {}

        AsyncFunction("getPermissionStatus") {
            val context = appContext.reactContext ?: throw Exception("No context")
            val isEnabled = BlockingService.isServiceEnabled(context)
            if (isEnabled) {
                return@AsyncFunction mapOf("isEnabled" to true)
            } else {
                return@AsyncFunction mapOf(
                    "isEnabled" to false,
                    "prompt" to mapOf(
                        "title" to "Enable Accessibility Service",
                        "message" to "To block apps, you need to enable the accessibility service for Zero In. Please enable it in the next screen."
                    )
                )
            }
        }

        AsyncFunction("requestPermission") {
            val context = appContext.reactContext ?: throw Exception("No context")
            val intent = Intent(android.provider.Settings.ACTION_ACCESSIBILITY_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
        }

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
        }
    }
}
