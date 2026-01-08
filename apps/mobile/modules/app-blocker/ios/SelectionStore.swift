import FamilyControls
import Foundation

@available(iOS 15.0, *)
class SelectionStore {
  static let shared = SelectionStore()

  private let appGroupID = "group.dev.zeroin.mobile"
  private let selectionKey = "familyActivitySelection"

  var selection: FamilyActivitySelection? {
    get {
      guard let defaults = UserDefaults(suiteName: appGroupID),
            let data = defaults.data(forKey: selectionKey)
      else {
        return nil
      }
      return try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
    }
    set {
      guard let defaults = UserDefaults(suiteName: appGroupID) else { return }
      if let newValue,
         let data = try? JSONEncoder().encode(newValue)
      {
        defaults.set(data, forKey: selectionKey)
      } else {
        defaults.removeObject(forKey: selectionKey)
      }
    }
  }

  private init() {}
}

// TODO: Below is put here because this file is symlinked to the extension target. Find a better way to do organize shared code.
import DeviceActivity

@available(iOS 15.0, *)
extension DeviceActivityName {
  static let zeroInScheduleStart = DeviceActivityName("zero-in-schedule-start")
  static let zeroInScheduleEnd = DeviceActivityName("zero-in-schedule-end")
}
