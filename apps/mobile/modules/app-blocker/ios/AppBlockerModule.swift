import ExpoModulesCore
import FamilyControls
import ManagedSettings
import UserNotifications

public class AppBlockerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AppBlocker")

    AsyncFunction("getPermissionStatus") { (promise: Promise) in
      if #available(iOS 15.0, *) {
        let ac = AuthorizationCenter.shared
        promise.resolve(["isGranted": ac.authorizationStatus == .approved])
      } else {
        promise.reject("UNSUPPORTED_OS_VERSION", "FamilyControls is not available on this OS version.")
      }
    }

    AsyncFunction("requestPermissions") { (promise: Promise) in
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
        promise.reject("UNSUPPORTED_OS_VERSION", "FamilyControls is not available on this OS version.")
      }
    }

    AsyncFunction("blockApps") { (promise: Promise) in
        if #available(iOS 15.0, *) {
            // Request notification permissions first
            UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
                if granted {
                    NSLog("AppBlockerModule: Notification permission granted, scheduling blocking notification")
                    // Schedule a notification after 5 seconds
                    let content = UNMutableNotificationContent()
                    content.title = "App Blocking"
                    content.body = "Blocking apps now..."
                    content.sound = .default
                    
                    // Store the selection data in userInfo to pass to notification service extension
                    if let selection = SelectionStore.shared.selection {
                        // Note: We'll handle the actual blocking in the notification service extension
                        content.userInfo = ["shouldBlock": true]
                    }
                    
                    let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 5, repeats: false)
                    let request = UNNotificationRequest(identifier: "blockApps", content: content, trigger: trigger)
                    
                    UNUserNotificationCenter.current().add(request) { error in
                        if let error = error {
                            promise.reject("NOTIFICATION_ERROR", error.localizedDescription)
                        } else {
                            promise.resolve(nil)
                        }
                    }
                } else {
                    promise.reject("NOTIFICATION_PERMISSION_DENIED", "Notification permission was denied")
                }
            }
        } else {
            promise.reject("UNSUPPORTED_OS_VERSION", "FamilyControls is not available on this OS version.")
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
            promise.reject("UNSUPPORTED_OS_VERSION", "FamilyControls is not available on this OS version.")
        }
    }

    View(AppPickerView.self) {}
  }
}
