import Foundation
import FamilyControls

@available(iOS 15.0, *)
class SelectionStore {
    static let shared = SelectionStore()
    var selection: FamilyActivitySelection?

    private init() {}
}
