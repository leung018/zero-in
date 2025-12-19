import FamilyControls
import Foundation

@available(iOS 15.0, *)
class SelectionStore {
  static let shared = SelectionStore()
  var selection: FamilyActivitySelection?

  private init() {}
}
