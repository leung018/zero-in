package expo.modules.appblocker

import android.content.Context
import android.content.pm.PackageManager
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

class AppPickerView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {

    private val recyclerView: RecyclerView = RecyclerView(context).apply {
        layoutManager = LinearLayoutManager(context)
    }
    private val adapter: AppListAdapter
    private var selectedApps: List<String> = emptyList()
    private val onAppsLoaded by EventDispatcher()

    init {
        adapter = AppListAdapter(context) { selectedPackages ->
            saveSelectedPackages(selectedPackages)
        }

        recyclerView.adapter = adapter

        addView(
            recyclerView, LayoutParams(
                LayoutParams.MATCH_PARENT,
                LayoutParams.MATCH_PARENT
            )
        )

        loadInstalledApps()
    }

    fun setSelectedApps(apps: List<String>) {
        selectedApps = apps
        adapter.setSelectedApps(apps)
    }

    private fun loadInstalledApps() {
        // Load apps in background thread to avoid blocking UI
        Thread {
            try {
                val pm = context.packageManager
                val apps = pm.getInstalledApplications(PackageManager.GET_META_DATA)
                    .filter { pm.getLaunchIntentForPackage(it.packageName) != null }
                    .map { app ->
                        AppInfo(
                            packageName = app.packageName,
                            appName = app.loadLabel(pm).toString(),
                            icon = app.loadIcon(pm)
                        )
                    }
                    .sortedBy { it.appName }

                // Update UI on main thread
                post {
                    adapter.setApps(apps)
                    onAppsLoaded(emptyMap())
                }
            } catch (e: Exception) {
                Log.e("AppPickerView", "Failed to load apps", e)
            }
        }.start()
    }

    private fun saveSelectedPackages(selectedPackages: List<String>) {
        val prefs = context.getSharedPreferences(BlockingService.PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().apply {
            putStringSet(BlockingService.KEY_BLOCKED_APPS, selectedPackages.toSet())
            apply()
        }
    }
}

class AppListAdapter(
    private val context: Context,
    private val onSelectionChanged: (List<String>) -> Unit
) : RecyclerView.Adapter<AppListAdapter.ViewHolder>() {

    private var apps: List<AppInfo> = emptyList()
    private val selectedPackages = mutableSetOf<String>()

    fun setApps(newApps: List<AppInfo>) {
        apps = newApps
        notifyDataSetChanged()
    }

    fun setSelectedApps(packages: List<String>) {
        selectedPackages.clear()
        selectedPackages.addAll(packages)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(context).inflate(
            android.R.layout.simple_list_item_multiple_choice,
            parent,
            false
        )
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val app = apps[position]
        holder.bind(app, selectedPackages.contains(app.packageName))
    }

    override fun getItemCount() = apps.size

    inner class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        private val checkedTextView: android.widget.CheckedTextView =
            view as android.widget.CheckedTextView

        init {
            itemView.setOnClickListener {
                checkedTextView.toggle()
                val app = apps[bindingAdapterPosition]
                if (checkedTextView.isChecked) {
                    selectedPackages.add(app.packageName)
                } else {
                    selectedPackages.remove(app.packageName)
                }
                onSelectionChanged(selectedPackages.toList())
            }
        }

        fun bind(app: AppInfo, isSelected: Boolean) {
            checkedTextView.text = app.appName
            checkedTextView.isChecked = isSelected

            // Ensure a fixed icon size by scaling the drawable to 32dp
            val density = context.resources.displayMetrics.density
            val targetSize = (32 * density).toInt()

            val drawable = app.icon
            val fixedDrawable = try {
                val bitmap = android.graphics.drawable.BitmapDrawable(context.resources, drawableToBitmap(drawable))
                val scaledBitmap = android.graphics.Bitmap.createScaledBitmap(bitmap.bitmap, targetSize, targetSize, true)
                android.graphics.drawable.BitmapDrawable(context.resources, scaledBitmap).apply {
                    setBounds(0, 0, targetSize, targetSize)
                }
            } catch (_: Exception) {
                // Fallback: use original drawable with explicit bounds
                drawable.apply { setBounds(0, 0, targetSize, targetSize) }
            }

            // Use setCompoundDrawables (non-intrinsic) to respect bounds
            checkedTextView.setCompoundDrawables(fixedDrawable, null, null, null)
            checkedTextView.compoundDrawablePadding = 32
        }

        private fun drawableToBitmap(drawable: android.graphics.drawable.Drawable): android.graphics.Bitmap {
            return when (drawable) {
                is android.graphics.drawable.BitmapDrawable -> drawable.bitmap
                else -> {
                    val width = if (drawable.intrinsicWidth > 0) drawable.intrinsicWidth else 1
                    val height = if (drawable.intrinsicHeight > 0) drawable.intrinsicHeight else 1
                    val bitmap = android.graphics.Bitmap.createBitmap(width, height, android.graphics.Bitmap.Config.ARGB_8888)
                    val canvas = android.graphics.Canvas(bitmap)
                    drawable.setBounds(0, 0, canvas.width, canvas.height)
                    drawable.draw(canvas)
                    bitmap
                }
            }
        }
    }
}

data class AppInfo(
    val packageName: String,
    val appName: String,
    val icon: android.graphics.drawable.Drawable
)
