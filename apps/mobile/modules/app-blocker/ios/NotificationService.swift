import UserNotifications
import FamilyControls
import ManagedSettings

public class NotificationService: UNNotificationServiceExtension {

    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?

    override public func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        self.contentHandler = contentHandler
        bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
        NSLog("NotificationService: didReceive called")
        
        if let bestAttemptContent = bestAttemptContent {
            // This is where we perform the actual blocking when notification is triggered
            NSLog("NotificationService: didReceive called - executing blocking logic in background")
            
            if #available(iOS 15.0, *) {
                if bestAttemptContent.userInfo["shouldBlock"] as? Bool == true {
                    NSLog("NotificationService: Blocking apps now...")
                    
                    // Perform the actual blocking here
                    if let selection = SelectionStore.shared.selection {
                        let store = ManagedSettingsStore()
                        store.shield.applicationCategories = ShieldSettings.ActivityCategoryPolicy.specific(selection.categoryTokens)
                        store.shield.applications = selection.applicationTokens
                        store.shield.webDomains = selection.webDomainTokens
                        
                        NSLog("NotificationService: Apps blocked successfully!")
                        bestAttemptContent.body = "Apps have been blocked successfully"
                    } else {
                        NSLog("NotificationService: No selection found")
                        bestAttemptContent.body = "No apps selected to block"
                    }
                }
            }
            
            contentHandler(bestAttemptContent)
        }
    }
    
    override public func serviceExtensionTimeWillExpire() {
        // Called just before the extension will be terminated by the system.
        // Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
        if let contentHandler = contentHandler, let bestAttemptContent =  bestAttemptContent {
            NSLog("NotificationService: serviceExtensionTimeWillExpire called")
            contentHandler(bestAttemptContent)
        }
    }

}
