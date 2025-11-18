import ExpoModulesCore
import GoogleSignIn

public class GoogleSignInModule: Module {
    private var webClientId: String?

    public func definition() -> ModuleDefinition {
        Name("MyGoogleSignIn")

        AsyncFunction("signIn") { (promise: Promise) in
            guard
                let windowScene = UIApplication.shared.connectedScenes.first
                    as? UIWindowScene,
                let rootViewController = windowScene.windows.first?
                    .rootViewController
            else {
                promise.reject(
                    Exception(
                        name: "NoViewControllerError",
                        description: "Cannot find a window scene or root view controller",
                        code: "NO_VIEW_CONTROLLER"
                    )
                )
                return
            }

            GIDSignIn.sharedInstance.signIn(withPresenting: rootViewController)
            { signInResult, error in
                if let error = error as NSError? {
                    if error.domain == GIDSignInError.errorDomain && error.code == GIDSignInError.Code.canceled.rawValue {
                        promise.reject(Exception(
                            name: "SignInError",
                            description: "User cancelled sign in",
                            code: "USER_CANCELLED",
                        ))
                        return
                    } else {
                        promise.reject(
                            Exception(
                                name: "SignInError",
                                description: error.localizedDescription,
                                code: "UNKNOWN_ERROR"
                            )
                        )
                        return
                    }
                }

                guard let result = signInResult,
                    let idToken = result.user.idToken?.tokenString
                else {
                    promise.reject(
                        Exception(
                            name: "SignInError",
                            description: "No ID token available",
                            code: "NON_TOKEN",
                        )
                    )
                    return
                }

                promise.resolve(idToken)
            }
        }
    }
}
