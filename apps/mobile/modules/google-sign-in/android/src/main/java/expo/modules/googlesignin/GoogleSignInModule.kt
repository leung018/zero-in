package expo.modules.googlesignin

import android.credentials.GetCredentialException
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.Promise
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class ConfigureOptions : Record {
    @Field
    val webClientId: String = ""
}

class GoogleSignInModule : Module() {
    private val googleIdOptionBuilder = GetGoogleIdOption.Builder()
    private lateinit var credentialManager: CredentialManager

    override fun definition() = ModuleDefinition {
        Name("GoogleSignIn")

        OnCreate {
            credentialManager = CredentialManager.create(appContext.reactContext!!)
        }

        Function("configure") { options: ConfigureOptions ->
            googleIdOptionBuilder.setServerClientId(options.webClientId)
        }

        AsyncFunction("signIn") { promise: Promise ->
            val googleIdOption: GetGoogleIdOption = googleIdOptionBuilder
                .setAutoSelectEnabled(true)
                .setAutoSelectEnabled(true)
                .build()

            val request: GetCredentialRequest = GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .build()

            CoroutineScope(Dispatchers.Main).launch {
                val result = credentialManager.getCredential(
                    request = request,
                    context = appContext.currentActivity!!
                )
                handleSignIn(result, promise)
            }
        }
    }

    private fun handleSignIn(result: GetCredentialResponse, promise: Promise) {
        when (val credential = result.credential) {
            is GoogleIdTokenCredential -> {
                val idToken = credential.idToken
                promise.resolve(idToken)
            }
        }
    }
}
