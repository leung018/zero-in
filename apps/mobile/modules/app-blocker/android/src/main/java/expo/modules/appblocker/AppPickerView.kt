package expo.modules.appblocker

import android.content.Context
import android.content.pm.PackageManager
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

class AppPickerView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {

    // Create RecyclerView for app list
    private val recyclerView: RecyclerView = RecyclerView(context).apply {
        layoutManager = LinearLayoutManager(context)
    }
    private val adapter: AppListAdapter
    private var selectedApps: List<String> = emptyList()

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

        // Load installed apps
        loadInstalledApps()
    }

    fun setSelectedApps(apps: List<String>) {
        selectedApps = apps
        adapter.setSelectedApps(apps)
    }

    private fun loadInstalledApps() {
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

        adapter.setApps(apps)
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
        // Create view holder (simplified)
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
                val app = apps[adapterPosition]
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
            checkedTextView.setCompoundDrawablesWithIntrinsicBounds(app.icon, null, null, null)
            checkedTextView.compoundDrawablePadding = 32
        }
    }
}

data class AppInfo(
    val packageName: String,
    val appName: String,
    val icon: android.graphics.drawable.Drawable
)
