import {
  deleteUser,
  getAuth,
  reauthenticateWithCredential,
  revokeToken,
  User
} from '@react-native-firebase/auth'
import { getAppleCredential, getGoogleCredential } from '../firebase/auth-credentials'
import { AccountAuth, ReauthResult } from './interface'

export class FirebaseAccountAuth implements AccountAuth {
  private appleAuthorizationCode: string | null = null

  async reauthenticate(): Promise<ReauthResult> {
    const user = this.requireCurrentUser()
    const providerId = user.providerData[0]?.providerId

    switch (providerId) {
      case 'google.com':
        return this.reauthenticateWithGoogle(user)
      case 'apple.com':
        return this.reauthenticateWithApple(user)
      default:
        throw new Error(`Unsupported sign-in provider: ${providerId}`)
    }
  }

  async deleteUser(): Promise<void> {
    await this.revokeAppleToken()
    await deleteUser(this.requireCurrentUser())
  }

  private async reauthenticateWithGoogle(user: User): Promise<ReauthResult> {
    const credential = await getGoogleCredential()
    if (!credential) return 'cancelled'

    await reauthenticateWithCredential(user, credential)
    return 'reauthenticated'
  }

  private async reauthenticateWithApple(user: User): Promise<ReauthResult> {
    const result = await getAppleCredential()
    if (!result) return 'cancelled'

    await reauthenticateWithCredential(user, result.credential)
    this.appleAuthorizationCode = result.authorizationCode
    return 'reauthenticated'
  }

  private async revokeAppleToken(): Promise<void> {
    if (!this.appleAuthorizationCode) return

    try {
      await revokeToken(getAuth(), this.appleAuthorizationCode)
    } catch (error) {
      console.error('Failed to revoke Apple token:', error)
    }
  }

  private requireCurrentUser(): User {
    const user = getAuth().currentUser
    if (!user) {
      throw new Error('User not authenticated')
    }
    return user
  }
}
