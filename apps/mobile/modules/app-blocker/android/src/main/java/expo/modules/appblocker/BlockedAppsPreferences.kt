package expo.modules.appblocker

import android.content.Context
import android.content.SharedPreferences

class BlockedAppsPreferences(
  context: Context,
) {
  private val prefs: SharedPreferences =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  companion object {
    private const val PREFS_NAME = "app_blocker_prefs"
    private const val KEY_BLOCKED_APPS = "blocked_apps"
    private const val KEY_SCHEDULE_START_TIME = "schedule_start_time"
    private const val KEY_SCHEDULE_END_TIME = "schedule_end_time"
  }

  data class ScheduleWindow(
    val startTimeMillis: Long,
    val endTimeMillis: Long,
  )

  fun saveBlockedApps(packageNames: Set<String>) {
    prefs.edit().apply {
      putStringSet(KEY_BLOCKED_APPS, packageNames)
      apply()
    }
  }

  fun loadBlockedApps(): Set<String> =
    prefs.getStringSet(KEY_BLOCKED_APPS, emptySet()) ?: emptySet()

  fun saveScheduleWindow(
    startTimeMillis: Long,
    endTimeMillis: Long,
  ) {
    prefs.edit().apply {
      putLong(KEY_SCHEDULE_START_TIME, startTimeMillis)
      putLong(KEY_SCHEDULE_END_TIME, endTimeMillis)
      apply()
    }
  }

  fun clearScheduleWindow() {
    prefs.edit().apply {
      remove(KEY_SCHEDULE_START_TIME)
      remove(KEY_SCHEDULE_END_TIME)
      apply()
    }
  }

  fun loadScheduleWindow(): ScheduleWindow? {
    if (!prefs.contains(KEY_SCHEDULE_START_TIME) || !prefs.contains(KEY_SCHEDULE_END_TIME)) {
      return null
    }

    val startTime = prefs.getLong(KEY_SCHEDULE_START_TIME, -1L)
    val endTime = prefs.getLong(KEY_SCHEDULE_END_TIME, -1L)
    if (startTime <= 0L || endTime <= 0L || startTime >= endTime) {
      return null
    }

    return ScheduleWindow(
      startTimeMillis = startTime,
      endTimeMillis = endTime,
    )
  }
}
