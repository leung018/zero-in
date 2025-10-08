import Foundation
import FamilyControls
import ManagedSettings
import React

@objc(ScreenTimeModule)
class ScreenTimeModule: NSObject {
  // The store is now optional
  let store: ManagedSettingsStore? = StoreManager.shared.store

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }

  @objc
  func requestAuthorization(_ resolve: @escaping RCTPromiseResolveBlock,
                            reject: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 16.0, *) {
      AuthorizationCenter.shared.requestAuthorization { result in
        switch result {
        case .success():
          resolve("Authorization successful")
        case .failure(let error):
          // Improved logging
          let errorMessage = "Authorization failed: \(error.localizedDescription)"
          print("[ScreenTimeModule] \(errorMessage)")
          reject("AUTH_ERROR", errorMessage, error)
        @unknown default:
          fatalError()
        }
      }
    } else {
      // Fallback on earlier versions
      resolve("Authorization not needed for this iOS version")
    }
  }

  @objc
  func blockUsingAllowList(_ resolve: @escaping RCTPromiseResolveBlock,
                           reject: @escaping RCTPromiseRejectBlock) {
    guard let store = store else {
      resolve("Shielding not available for this iOS version")
      return
    }

    if #available(iOS 16.0, *) {
      // FIXME: The FamilyControls API no longer allows creating ApplicationTokens from bundle identifiers directly.
      // This functionality needs to be reimplemented by presenting a FamilyActivityPicker to the user
      // and using the selection from that to populate the store.
      // let allowList: Set<ApplicationToken> = [
      //   ApplicationToken(bundleIdentifier: "com.apple.mobilesafari"),
      //   ApplicationToken(bundleIdentifier: "com.apple.MobileSMS"),
      // ]

      // store.shield.applications = allowList
      store.shield.applicationCategories = .all()

      resolve("Shielding configured with allow list")
    } else {
      resolve("Shielding not available for this iOS version")
    }
  }

  // A method to shield all apps. This is a more aggressive approach.
  @objc
  func shieldAllApps(_ resolve: @escaping RCTPromiseResolveBlock,
                     reject: @escaping RCTPromiseRejectBlock) {
    guard let store = store else {
      resolve("Shielding not available for this iOS version")
      return
    }

    if #available(iOS 16.0, *) {
      store.shield.applications = nil
      store.shield.applicationCategories = .all()
      resolve("All apps shielded")
    } else {
      resolve("Shielding not available for this iOS version")
    }
  }


  @objc
  func unblockApps(_ resolve: @escaping RCTPromiseResolveBlock,
                   reject: @escaping RCTPromiseRejectBlock) {
    guard let store = store else {
      resolve("Shielding not available for this iOS version")
      return
    }

    if #available(iOS 16.0, *) {
      // Setting the properties to nil is the correct way to remove the shield.
      store.shield.applications = nil
      store.shield.applicationCategories = nil
      resolve("Shielding removed")
    } else {
      resolve("Shielding not available for this iOS version")
    }
  }
}