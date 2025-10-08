import Foundation
import ManagedSettings

// 1. Replace with the App Group identifier you created in Xcode
let appGroupIdentifier = "group.zero-in" // <-- IMPORTANT: CHANGE THIS

class StoreManager {
    static let shared = StoreManager()

    let store: ManagedSettingsStore?

    private init() {
        if #available(iOS 16.0, *) {
            // The userDefaults check is kept to ensure the App Group is configured,
            // even though the initializer doesn't use the userDefaults object directly.
            if UserDefaults(suiteName: appGroupIdentifier) != nil {
                self.store = ManagedSettingsStore(named: .default)
            } else {
                print("ERROR: Could not initialize UserDefaults with App Group identifier. Make sure the App Group is set up correctly in Xcode.")
                // Fallback to a non-shared store. Blocking will not work correctly in the extension.
                self.store = ManagedSettingsStore()
            }
        } else {
            self.store = nil
        }
    }
}
