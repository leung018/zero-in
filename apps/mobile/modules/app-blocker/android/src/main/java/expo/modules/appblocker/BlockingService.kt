package expo.modules.appblocker

import android.app.Service
import android.app.usage.UsageStatsManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.view.Gravity
import android.view.WindowManager
import android.widget.Button
import android.widget.FrameLayout
import android.widget.TextView
import androidx.core.graphics.toColorInt

class BlockingService : Service() {

    private lateinit var windowManager: WindowManager
    private var overlayView: FrameLayout? = null
    private var blockedApps: Set<String> = emptySet()
    private var isBlocking = false

    private val handler = Handler(Looper.getMainLooper())
    private lateinit var usageStatsManager: UsageStatsManager

    private val pollingRunnable = object : Runnable {
        override fun run() {
            val foregroundApp = getForegroundApp()
            if (isBlocking && foregroundApp != null && blockedApps.contains(foregroundApp)) {
                showBlockingOverlay(foregroundApp)
            } else {
                hideBlockingOverlay()
            }
            handler.postDelayed(this, 500) // Poll every 500ms
        }
    }

    private val preferencesReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == ACTION_RELOAD_PREFERENCES) {
                loadBlockedApps()
            }
        }
    }

    companion object {
        const val PREFS_NAME = "app_blocker_prefs"
        const val KEY_BLOCKED_APPS = "blocked_apps"
        const val KEY_IS_BLOCKING = "is_blocking"
        const val ACTION_RELOAD_PREFERENCES = "expo.modules.appblocker.RELOAD_PREFERENCES"
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        loadBlockedApps()

        val filter = IntentFilter(ACTION_RELOAD_PREFERENCES)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(preferencesReceiver, filter, RECEIVER_NOT_EXPORTED)
        } else {
            @Suppress("UnspecifiedRegisterReceiverFlag")
            registerReceiver(preferencesReceiver, filter)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        handler.post(pollingRunnable)
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(pollingRunnable)
        unregisterReceiver(preferencesReceiver)
        hideBlockingOverlay()
    }

    private fun getForegroundApp(): String? {
        val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as?
                android.app.usage.UsageStatsManager ?: return null

        val currentTime = System.currentTimeMillis()

        // Query usage stats for last 1 second
        val stats = usageStatsManager.queryUsageStats(
            android.app.usage.UsageStatsManager.INTERVAL_DAILY,
            currentTime - 1000,
            currentTime
        )

        // Find most recently used app
        return stats?.maxByOrNull { it.lastTimeUsed }?.packageName
    }

    /**
     * Shows a full-screen overlay that blocks the app
     */
    private fun showBlockingOverlay(packageName: String) {
        // Don't show if already showing
        if (overlayView != null) return

        // Create overlay view
        overlayView = FrameLayout(this).apply {
            setBackgroundColor("#F5F5F5".toColorInt())
        }

        // Inflate custom layout or create programmatically
        val contentView = createBlockingUI(packageName)
        overlayView?.addView(contentView)

        // Set up window parameters for overlay
        val windowType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            windowType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                    WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
        }

        try {
            windowManager.addView(overlayView, params)
        } catch (e: Exception) {
            // Handle permission issues
            e.printStackTrace()
        }
    }

    /**
     * Creates the UI shown when an app is blocked
     */
    private fun createBlockingUI(packageName: String): FrameLayout {
        val container = FrameLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            setPadding(40, 40, 40, 40)
        }

        // Get app name
        val appName = try {
            val appInfo = packageManager.getApplicationInfo(packageName, 0)
            packageManager.getApplicationLabel(appInfo).toString()
        } catch (_: Exception) {
            "This app"
        }

        // Title
        val titleView = TextView(this).apply {
            text = "App Blocked"
            textSize = 32f
            setTextColor(android.graphics.Color.BLACK)
            gravity = Gravity.CENTER
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = Gravity.CENTER
                topMargin = -200
            }
        }

        // Message
        val messageView = TextView(this).apply {
            text = "$appName is currently blocked.\n\nTake a break and come back later."
            textSize = 18f
            setTextColor(android.graphics.Color.DKGRAY)
            gravity = Gravity.CENTER
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = Gravity.CENTER
            }
        }

        // Close button
        val closeButton = Button(this).apply {
            text = "Go Back"
            textSize = 16f
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = Gravity.CENTER
                topMargin = 200
            }

            setOnClickListener {
                // Go to home screen
                val homeIntent = Intent(Intent.ACTION_MAIN).apply {
                    addCategory(Intent.CATEGORY_HOME)
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                startActivity(homeIntent)
                hideBlockingOverlay()
            }
        }

        container.addView(titleView)
        container.addView(messageView)
        container.addView(closeButton)

        return container
    }

    /**
     * Hides the blocking overlay
     */
    private fun hideBlockingOverlay() {
        overlayView?.let { view ->
            try {
                windowManager.removeView(view)
            } catch (_: Exception) {
                // Ignore exceptions when removing view
            }
            overlayView = null
        }
    }

    /**
     * Loads blocked apps list from SharedPreferences
     */
    private fun loadBlockedApps() {
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        blockedApps = prefs.getStringSet(KEY_BLOCKED_APPS, emptySet()) ?: emptySet()
        isBlocking = prefs.getBoolean(KEY_IS_BLOCKING, false)
    }
}
