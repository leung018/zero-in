import Foundation
import FamilyControls

@available(iOS 15.0, *)
class SelectionStore {
    static let shared = SelectionStore()
    var selection: FamilyActivitySelection? {
        didSet {
            saveSelection()
        }
    }

    private let defaults = UserDefaults.standard
    private let selectionKey = "familyActivitySelection"

    private init() {
        loadSelection()
    }

    private func saveSelection() {
        guard let selection = selection else {
            defaults.removeObject(forKey: selectionKey)
            return
        }
        
        if let encoded = try? JSONEncoder().encode(selection) {
            defaults.set(encoded, forKey: selectionKey)
        }
    }

    private func loadSelection() {
        guard let data = defaults.data(forKey: selectionKey),
              let decoded = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data) else {
            return
        }
        selection = decoded
    }
}
