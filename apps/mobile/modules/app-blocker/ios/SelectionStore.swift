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
