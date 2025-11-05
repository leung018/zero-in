import ExpoModulesCore
import GoogleSignIn

public class GoogleSignInModule: Module {
  private var webClientId: String?
  
  public func definition() -> ModuleDefinition {
    Name("MyGoogleSignIn")
    
    Function("configure") { (options: ConfigureOptions) in
      
    }
    
    AsyncFunction("signIn") { (promise: Promise) in
      promise.resolve("")
    }
  }
}

struct ConfigureOptions: Record {
  @Field
  var webClientId: String
}