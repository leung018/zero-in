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
                        name: "NoViewController",
                        description: "Cannot find root view controller"
                    )
                )
                return
            }

            GIDSignIn.sharedInstance.signIn(withPresenting: rootViewController)
            { signInResult, error in
                if let error = error {
                    promise.reject(
                        Exception(
                            name: "SignInError",
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
                            name: "SignInError",
                            description: "Failed to get ID token"
                        )
                    )
                    return
                }

                promise.resolve(idToken)
            }
        }
    }
}
