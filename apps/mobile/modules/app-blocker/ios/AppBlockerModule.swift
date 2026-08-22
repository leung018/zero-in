import DeviceActivity
import ExpoModulesCore
import FamilyControls
import ManagedSettings

public class AppBlockerModule: Module {
  /// `AuthorizationCenter.authorizationStatus` is cached for the whole lifetime of the process: it
  /// keeps reporting `.approved` after the user revokes Screen Time access in Settings, and neither
  /// re-reading it nor observing its publisher picks the change up. Asking DeviceActivity to
  /// schedule something is answered by the system daemon instead, so it reflects the current
  /// authorization. The probe activity is stopped right away and never fires.
  private static func isFamilyControlsAuthorized() -> Bool {
    let center = DeviceActivityCenter()
    let calendar = Calendar.current
    let dateComponents: Set<Calendar.Component> = [
      .era, .year, .month, .day, .hour, .minute, .second,
    ]
    let start = Date().addingTimeInterval(60 * 60)
    let schedule = DeviceActivitySchedule(
      intervalStart: calendar.dateComponents(dateComponents, from: start),
      intervalEnd: calendar.dateComponents(dateComponents, from: start.addingTimeInterval(15 * 60)),
      repeats: false
    )

    do {
      try center.startMonitoring(.zeroInAuthorizationProbe, during: schedule)
      center.stopMonitoring([.zeroInAuthorizationProbe])
      return true
    } catch DeviceActivityCenter.MonitoringError.unauthorized {
      return false
    } catch {
      // Any other failure says nothing about authorization, so keep the permission as granted.
      NSLog("[AppBlocker] Authorization probe failed for another reason: \(error)")
      return true
    }
  }

  public func definition() -> ModuleDefinition {
    Name("AppBlocker")

    AsyncFunction("getPermissionDetails") { (promise: Promise) in
      promise.resolve(["familyControls": AppBlockerModule.isFamilyControlsAuthorized()])
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
