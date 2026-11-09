import { GoogleAuthProvider, OAuthCredential, OAuthProvider } from '@react-native-firebase/auth'
import * as AppleAuthentication from 'expo-apple-authentication'
import * as Crypto from 'expo-crypto'
import GoogleSignInModule from '../../modules/google-sign-in'

export type AppleCredentialResult = {
  credential: OAuthCredential
  authorizationCode: string | null
}

export async function getGoogleCredential(): Promise<OAuthCredential | null> {
  let idToken: string
  try {
    idToken = await GoogleSignInModule.signIn()
  } catch (error: any) {
    if (error?.code === 'USER_CANCELLED') return null
    throw error
  }

  return GoogleAuthProvider.credential(idToken)
}

export async function getAppleCredential(): Promise<AppleCredentialResult | null> {
  // Firebase verifies the token's nonce against the SHA-256 of this raw nonce
  const rawNonce = Crypto.randomUUID()
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce)

  let appleCredential: AppleAuthentication.AppleAuthenticationCredential
  try {
    appleCredential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL
      ],
      nonce: hashedNonce
    })
  } catch (error: any) {
    if (error?.code === 'ERR_REQUEST_CANCELED') return null
    throw error
  }

  const { identityToken, fullName, authorizationCode } = appleCredential
  if (!identityToken) {
    throw new Error('missing identityToken')
  }

  return {
    credential: new OAuthProvider('apple.com').credential({
      idToken: identityToken,
      rawNonce,
      fullName: fullName ?? undefined
    }),
    authorizationCode
  }
}
