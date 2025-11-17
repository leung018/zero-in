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
                        name: "NO_VIEW_CONTROLLER",
                        description: "Cannot find a window scene or root view controller"
                    )
                )
                return
            }

            GIDSignIn.sharedInstance.signIn(withPresenting: rootViewController)
            { signInResult, error in
                if let error = error {
                    promise.reject(
                        Exception(
                            name: "UNKNOWN_ERROR",
                            description: error.localizedDescription
                        )
                    )
                    return
                }

                guard let result = signInResult,
                    let idToken = result.user.idToken?.tokenString
                else {
                    promise.reject(
                        Exception(
                            name: "NON_TOKEN",
                            description: "No ID token available"
                        )
                    )
                    return
                }

                promise.resolve(idToken)
            }
        }
    }
}
