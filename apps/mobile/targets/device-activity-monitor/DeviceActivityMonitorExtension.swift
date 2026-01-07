import DeviceActivity
import FamilyControls
import ManagedSettings

class DeviceActivityMonitorExtension: DeviceActivityMonitor {
  override func intervalDidStart(for activity: DeviceActivityName) {
    super.intervalDidStart(for: activity)

    // "start" schedule triggers blocking
    if activity == .zeroInScheduleStart {
      applyShields()
    }

    // "end" schedule triggers unblocking
    if activity == .zeroInScheduleEnd {
      removeShields()
    }
  }

  override func intervalDidEnd(for activity: DeviceActivityName) {
    super.intervalDidEnd(for: activity)
    // Do nothing. Unblocking is handled by the start of the "end" schedule.
  }

  private func applyShields() {
    // Read from the shared App Group storage
    if let selection = SelectionStore.shared.selection {
      let store = ManagedSettingsStore()
      store.shield.applicationCategories = ShieldSettings.ActivityCategoryPolicy
        .specific(selection.categoryTokens)
      store.shield.applications = selection.applicationTokens
      store.shield.webDomains = selection.webDomainTokens
    }
  }

  private func removeShields() {
    let store = ManagedSettingsStore()
    store.shield.applicationCategories = nil
    store.shield.applications = nil
    store.shield.webDomains = nil
  }
}
