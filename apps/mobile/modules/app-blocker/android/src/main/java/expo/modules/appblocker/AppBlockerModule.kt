package expo.modules.appblocker

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.URL

class AppBlockerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AppBlocker")

    View(AppPickerView::class) {
      Events("onSelectionChange")
      
      Prop("selectedApps") { view: AppPickerView, apps: List<String>? ->
        view.setSelectedApps(apps ?: emptyList())
      }
    }
  }
}
