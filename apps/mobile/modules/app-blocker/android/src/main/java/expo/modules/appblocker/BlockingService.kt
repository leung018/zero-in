package expo.modules.appblocker

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.provider.Settings
import android.util.Log
import android.view.Gravity
import android.view.WindowManager
import android.widget.Button
import android.widget.FrameLayout
import android.widget.TextView
import androidx.core.app.NotificationCompat
import androidx.core.graphics.toColorInt

class BlockingService : Service() {

    private lateinit var windowManager: WindowManager
    private var overlayView: FrameLayout? = null
    private var blockedApps: Set<String> = emptySet()
    private val handler = Handler(Looper.getMainLooper())
    private lateinit var usageStatsManager: UsageStatsManager
    private lateinit var preferences: BlockedAppsPreferences

    private val pollingRunnable = object : Runnable {
        override fun run() {
            val foregroundApp = getForegroundApp()
            if (foregroundApp == null) {
                handler.postDelayed(this, 500)
                return
            }

            if (blockedApps.contains(foregroundApp)) {
                showBlockingOverlay(foregroundApp)
            } else {
                hideBlockingOverlay()
            }
            handler.postDelayed(this, 500)
        }
    }

    companion object {
        const val NOTIFICATION_CHANNEL_ID = "app_blocker_channel"
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        preferences = BlockedAppsPreferences(this)
        loadBlockedApps()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setContentTitle("App Blocker Active")
            .setContentText("Monitoring app usage to keep you focused.")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .build()

        startForeground(1, notification)

        loadBlockedApps()
        handler.post(pollingRunnable)
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(pollingRunnable)
        hideBlockingOverlay()
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            NOTIFICATION_CHANNEL_ID,
            "App Blocker",
            NotificationManager.IMPORTANCE_DEFAULT
        )
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(channel)
    }

    private fun getForegroundApp(): String? {
        val time = System.currentTimeMillis()
        val events = usageStatsManager.queryEvents(time - 1000 * 10, time)
        val event = UsageEvents.Event()
        var lastApp: String? = null

        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED) {
                lastApp = event.packageName
            }
        }
        return lastApp
    }

    /**
     * Shows a full-screen overlay that blocks the app
     */
    private fun showBlockingOverlay(packageName: String) {
        // Don't show if already showing
        if (overlayView != null) return

        // Check if we have overlay permission
        if (!Settings.canDrawOverlays(this)) {
            Log.e("BlockingService", "Cannot show overlay - permission not granted")
            return
        }

        // Create overlay view
        overlayView = FrameLayout(this).apply {
            setBackgroundColor("#F5F5F5".toColorInt())
        }

        // Inflate custom layout or create programmatically
        val contentView = createBlockingUI(packageName)
        overlayView?.addView(contentView)

        // Set up window parameters for overlay
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
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
            // Handle permission issues or bad token exceptions
            Log.e("BlockingService", "Failed to add overlay view", e)
            overlayView = null
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

    private fun loadBlockedApps() {
        blockedApps = preferences.loadBlockedApps()
    }
}
