package expo.modules.googlesignin

import android.content.Context
import android.util.Log
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class GoogleSignInModule : Module() {
    private var webClientId = ""
    private lateinit var credentialManager: CredentialManager

    override fun definition() = ModuleDefinition {
        Name("MyGoogleSignIn")

        OnCreate {
            credentialManager = CredentialManager.create(appContext.reactContext!!)
            webClientId = getWebClientIdFromResources(appContext.reactContext!!)
        }

        AsyncFunction("signIn") { promise: Promise ->
            val option = GetSignInWithGoogleOption.Builder(webClientId).build()

            val request: GetCredentialRequest = GetCredentialRequest.Builder()
                .addCredentialOption(option)
                .build()

            CoroutineScope(Dispatchers.Default).launch {
                try {
                    val result = credentialManager.getCredential(
                        request = request,
                        context = appContext.currentActivity!!
                    )
                    handleSignIn(result, promise)
                } catch (ex: Exception) {
                    Log.e("GoogleSignInModule", ex.stackTraceToString())
                    promise.reject("UNKNOWN_ERROR", ex.message, null)
                }
            }
        }
    }

    private fun getWebClientIdFromResources(context: Context): String {
        val resId = context.applicationContext.resources.getIdentifier(
            "default_web_client_id",
            "string",
            context.applicationContext.packageName
        )
        return if (resId != 0) context.getString(resId) else throw Exception("Cannot get webClientId")
    }

    private fun handleSignIn(result: GetCredentialResponse, promise: Promise) {
        val credential = result.credential
        if (credential is CustomCredential && credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
            val googleIdToken = GoogleIdTokenCredential
                .createFrom(credential.data).idToken
            return promise.resolve(googleIdToken)
        }
        promise.reject("NON_TOKEN", "No ID token available", null)
    }
}
