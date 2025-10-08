import Foundation
import FamilyControls
import ManagedSettings

@objc(ScreenTimeModule)
class ScreenTimeModule: NSObject {

  private let store = ManagedSettingsStore()

  @objc
  func requestAuthorization(_ resolve: @escaping RCTPromiseResolveBlock,
                            reject: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 16.0, *) {
      AuthorizationCenter.shared.requestAuthorization { result in
        switch result {
        case .success:
          resolve(true)
        case .failure(let error):
          reject("AUTH_ERROR", error.localizedDescription, error)
        }
      }
    } else {
      reject("UNSUPPORTED_OS", "Screen Time API is not available on this version of iOS.", nil)
    }
  }

  @objc
  func blockUsingAllowList(_ resolve: @escaping RCTPromiseResolveBlock,
                           reject: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 16.0, *) {
      // Hardcoded allow list of bundle identifiers.
      // I've used Messages and Safari as examples.
      let allowedApps = ["com.apple.MobileSMS", "com.apple.mobilesafari"]
      let allowedTokens = allowedApps.map { ApplicationToken(bundleIdentifier: $0) }

      // Shield all applications *except* for the ones in the allow list.
      store.shield.applications = .all(except: Set(allowedTokens))
      
      resolve(true)
    } else {
      reject("UNSUPPORTED_OS", "Screen Time API is not available on this version of iOS.", nil)
    }
  }

  @objc
  func unblockApps(_ resolve: @escaping RCTPromiseResolveBlock,
                   reject: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 16.0, *) {
      // Setting the properties to nil is the correct way to remove the shield.
      store.shield.applications = nil
      resolve(true)
    } else {
      reject("UNSUPPORTED_OS", "Screen Time API is not available on this version of iOS.", nil)
    }
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
}