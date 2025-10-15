package expo.modules.appblocker

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.PixelFormat
import android.os.Build
import android.view.Gravity
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.widget.Button
import android.widget.FrameLayout
import android.widget.TextView
import androidx.core.graphics.toColorInt

class BlockingService : AccessibilityService() {

    private lateinit var windowManager: WindowManager
    private var overlayView: FrameLayout? = null
    private var blockedApps: Set<String> = emptySet()
    private var isBlocking = false

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

        fun isServiceEnabled(context: Context): Boolean {
            val prefString = android.provider.Settings.Secure.getString(
                context.contentResolver,
                android.provider.Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            )
            return prefString?.contains(context.packageName) == true
        }
    }

    override fun onServiceConnected() {
        // Configure accessibility service
        val info = AccessibilityServiceInfo().apply {
            // Listen to window state changes (app launches)
            eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED

            // Get package name of foreground app
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC

            // Don't delay events
            notificationTimeout = 0

            // Get all apps
            flags = AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS
        }

        serviceInfo = info

        // Initialize WindowManager for overlay
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager

        // Load blocked apps from storage
        loadBlockedApps()

        val filter = IntentFilter(ACTION_RELOAD_PREFERENCES)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(preferencesReceiver, filter, RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(preferencesReceiver, filter)
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        // Only care about window state changes (app launches)
        if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return

        // Get package name of the app that just opened
        val packageName = event.packageName?.toString() ?: return

        // Ignore system UI and our own app
        if (packageName.startsWith("com.android.systemui") ||
            packageName == applicationContext.packageName
        ) {
            return
        }

        // Check if this app should be blocked
        if (isBlocking && blockedApps.contains(packageName)) {
            showBlockingOverlay(packageName)
        } else {
            hideBlockingOverlay()
        }
    }

    override fun onInterrupt() {
        // Called when service is interrupted
        hideBlockingOverlay()
    }

    override fun onDestroy() {
        super.onDestroy()
        unregisterReceiver(preferencesReceiver)
        hideBlockingOverlay()
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
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY, // Requires API 22+
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

    /**
     * Updates the list of blocked apps
     * Called from the module when user changes selection
     */
    fun updateBlockedApps(apps: Set<String>, shouldBlock: Boolean) {
        blockedApps = apps
        isBlocking = shouldBlock

        // Save to storage
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        prefs.edit().apply {
            putStringSet(KEY_BLOCKED_APPS, apps)
            putBoolean(KEY_IS_BLOCKING, shouldBlock)
            apply()
        }

        // If not blocking, hide overlay
        if (!shouldBlock) {
            hideBlockingOverlay()
        }
    }
}
