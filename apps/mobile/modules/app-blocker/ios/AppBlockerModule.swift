import DeviceActivity
import ExpoModulesCore
import FamilyControls
import ManagedSettings

public class AppBlockerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AppBlocker")

    AsyncFunction("getPermissionDetails") { (promise: Promise) in
      if #available(iOS 15.0, *) {
        let ac = AuthorizationCenter.shared
        let isGranted = ac.authorizationStatus == .approved
        promise.resolve(["familyControls": isGranted])
      } else {
        promise.reject(
          "UNSUPPORTED_OS_VERSION",
          "FamilyControls is not available on this OS version."
        )
      }
    }

    AsyncFunction("requestPermission") { (_: String, promise: Promise) in
      if #available(iOS 16.0, *) {
        Task {
          do {
            try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
            promise.resolve(nil)
          } catch {
            promise.reject(error)
          }
        }
      } else {
        promise.reject(
          "UNSUPPORTED_OS_VERSION",
          "FamilyControls is not available on this OS version."
        )
      }
    }

    AsyncFunction("blockApps") { (promise: Promise) in
      if #available(iOS 15.0, *) {
        if let selection = SelectionStore.shared.selection {
          let store = ManagedSettingsStore()
          store.shield.applicationCategories = ShieldSettings.ActivityCategoryPolicy
            .specific(selection.categoryTokens)
          store.shield.applications = selection.applicationTokens
          store.shield.webDomains = selection.webDomainTokens
        }
        promise.resolve(nil)
      } else {
        promise.reject(
          "UNSUPPORTED_OS_VERSION",
          "FamilyControls is not available on this OS version."
        )
      }
    }

    AsyncFunction("unblockApps") { (promise: Promise) in
      if #available(iOS 15.0, *) {
        let store = ManagedSettingsStore()
        store.shield.applicationCategories = nil
        store.shield.applications = nil
        store.shield.webDomains = nil
        promise.resolve(nil)
      } else {
        promise.reject(
          "UNSUPPORTED_OS_VERSION",
          "FamilyControls is not available on this OS version."
        )
      }
    }

    AsyncFunction("setSchedule") { (startTime: Double, endTime: Double, promise: Promise) in
      if #available(iOS 16.0, *) {
        let start = Date(timeIntervalSince1970: startTime / 1000.0)
        let end = Date(timeIntervalSince1970: endTime / 1000.0)

        let center = DeviceActivityCenter()
        let activityName = DeviceActivityName("zero-in-active-schedule")

        // Stop any existing schedule
        center.stopMonitoring([activityName])

        // Create new schedule
        let calendar = Calendar.current
        let schedule = DeviceActivitySchedule(
          intervalStart: calendar.dateComponents(
            [.era, .year, .month, .day, .hour, .minute, .second],
            from: start
          ),
          intervalEnd: calendar.dateComponents(
            [.era, .year, .month, .day, .hour, .minute, .second],
            from: end
          ),
          repeats: false
        )

        do {
          try center.startMonitoring(activityName, during: schedule)

          // Apply shields immediately if schedule starts now or in the past
          if start <= Date() {
            if let selection = SelectionStore.shared.selection {
              let store = ManagedSettingsStore()
              store.shield.applicationCategories = ShieldSettings.ActivityCategoryPolicy
                .specific(selection.categoryTokens)
              store.shield.applications = selection.applicationTokens
              store.shield.webDomains = selection.webDomainTokens
            }
          }

          promise.resolve(nil)
        } catch {
          promise.reject(error)
        }
      } else {
        promise.reject(
          "UNSUPPORTED_OS_VERSION",
          "DeviceActivity is not available on this OS version."
        )
      }
    }

    AsyncFunction("clearSchedule") { (promise: Promise) in
      if #available(iOS 16.0, *) {
        let center = DeviceActivityCenter()
        let activityName = DeviceActivityName("zero-in-active-schedule")

        // Stop monitoring
        center.stopMonitoring([activityName])

        // Remove shields
        let store = ManagedSettingsStore()
        store.shield.applicationCategories = nil
        store.shield.applications = nil
        store.shield.webDomains = nil

        promise.resolve(nil)
      } else {
        promise.reject(
          "UNSUPPORTED_OS_VERSION",
          "DeviceActivity is not available on this OS version."
        )
      }
    }

    View(AppPickerView.self) {}
  }
}
