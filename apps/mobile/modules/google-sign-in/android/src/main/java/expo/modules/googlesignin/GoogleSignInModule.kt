package expo.modules.googlesignin

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.Promise

class ConfigureOptions : Record {
    @Field
    val webClientId: String = ""
}

class GoogleSignInModule : Module() {

  override fun definition() = ModuleDefinition {
    Name("GoogleSignIn")

    Function("configure") { options: ConfigureOptions ->

    }

    AsyncFunction("signIn") { promise: Promise ->
       promise.resolve("")
    }
  }
}
