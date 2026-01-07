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

        // Clean up old schedules
        center.stopMonitoring([
          .zeroInScheduleStart,
          .zeroInScheduleEnd,
        ])

        // Create new schedules (Two-Schedule Trick)
        // 1. Start Schedule: Triggers "applyShields" at start time
        // 2. End Schedule: Triggers "removeShields" at end time
        // Both must be >= 15 minutes. We use roughly 15m + buffer to be safe, but 15m is min.
        // Even if the actual block is 5 mins, we set Start Schedule [start, start+15]
        // and End Schedule [end, end+15].
        // At 'end', End Schedule starts -> triggers removeShields.

        let calendar = Calendar.current
        let fifteenMins = TimeInterval(15 * 60)

        // Use constants directly or ActivityName(rawValue:) if needed but we have extension now.
        // center.startMonitoring takes a DeviceActivityName.
        // We can just pass the name if we want, but better to use the constant to create the
        // schedule?
        // Ah, startMonitoring takes (activityName, during: schedule).

        let scheduleStart = DeviceActivitySchedule(
          intervalStart: calendar.dateComponents(
            [.era, .year, .month, .day, .hour, .minute, .second],
            from: start
          ),
          intervalEnd: calendar.dateComponents(
            [.era, .year, .month, .day, .hour, .minute, .second],
            from: start.addingTimeInterval(fifteenMins)
          ),
          repeats: false
        )

        let scheduleEnd = DeviceActivitySchedule(
          intervalStart: calendar.dateComponents(
            [.era, .year, .month, .day, .hour, .minute, .second],
            from: end
          ),
          intervalEnd: calendar.dateComponents(
            [.era, .year, .month, .day, .hour, .minute, .second],
            from: end.addingTimeInterval(fifteenMins)
          ),
          repeats: false
        )

        do {
          try center.startMonitoring(.zeroInScheduleStart, during: scheduleStart)
          try center.startMonitoring(.zeroInScheduleEnd, during: scheduleEnd)

          // Apply shields immediately if we are currently within the blocking window
          // This handles cases where we set the schedule after 'start' has already passed.
          let now = Date()
          if start <= now, now < end {
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

        // Stop monitoring all potential schedules
        center.stopMonitoring([
          .zeroInScheduleStart,
          .zeroInScheduleEnd,
        ])

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

    View(AppPickerView.self) {
      Events("onAppsLoaded")
    }
  }
}
