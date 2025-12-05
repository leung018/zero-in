package expo.modules.appblocker

import android.content.Context
import android.content.SharedPreferences

class BlockedAppsPreferences(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    companion object {
        private const val PREFS_NAME = "app_blocker_prefs"
        private const val KEY_BLOCKED_APPS = "blocked_apps"
    }

    fun saveBlockedApps(packageNames: Set<String>) {
        prefs.edit().apply {
            putStringSet(KEY_BLOCKED_APPS, packageNames)
            apply()
        }
    }

    fun loadBlockedApps(): Set<String> {
        return prefs.getStringSet(KEY_BLOCKED_APPS, emptySet()) ?: emptySet()
    }
}

