import ExpoModulesCore
import FamilyControls
import SwiftUI

class AppPickerView: ExpoView {
  private var hostingController: UIHostingController<FamilyPickerView>?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    hostingController?.view.frame = bounds
  }

  override func didMoveToSuperview() {
    super.didMoveToSuperview()
    if superview != nil {
      if #available(iOS 15.0, *) {
        let picker = FamilyPickerView(onSelectionChange: { selection in
          SelectionStore.shared.selection = selection
        })
        hostingController = UIHostingController(rootView: picker)
        if let hostView = hostingController?.view {
          addSubview(hostView)
        }
      } else {
        print("FamilyControls is not available on this OS version.")
      }
    }
  }
}

@available(iOS 15.0, *)
struct FamilyPickerView: View {
  @State private var selection: FamilyActivitySelection

  init(onSelectionChange: @escaping (FamilyActivitySelection) -> Void) {
    self.onSelectionChange = onSelectionChange
    _selection = State(initialValue: SelectionStore.shared.selection ?? FamilyActivitySelection())
  }

  var onSelectionChange: (FamilyActivitySelection) -> Void

  var body: some View {
    FamilyActivityPicker(selection: $selection)
      .onChange(of: selection) { newSelection in
        onSelectionChange(newSelection)
      }
  }
}
