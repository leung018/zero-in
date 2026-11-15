import {
  deleteUser,
  getAuth,
  reauthenticateWithCredential,
  User
} from '@react-native-firebase/auth'
import { getGoogleCredential } from '../firebase/auth-credentials'
import { AccountAuth, ReauthResult } from './interface'

export class FirebaseAccountAuth implements AccountAuth {
  async reauthenticate(): Promise<ReauthResult> {
    const user = this.requireCurrentUser()
    const providerId = user.providerData[0]?.providerId

    switch (providerId) {
      case 'google.com':
        return this.reauthenticateWithGoogle(user)
      default:
        throw new Error(`Unsupported sign-in provider: ${providerId}`)
    }
  }

  async deleteUser(): Promise<void> {
    await deleteUser(this.requireCurrentUser())
  }

  private async reauthenticateWithGoogle(user: User): Promise<ReauthResult> {
    const credential = await getGoogleCredential()
    if (!credential) return 'cancelled'

    await reauthenticateWithCredential(user, credential)
    return 'reauthenticated'
  }

  private requireCurrentUser(): User {
    const user = getAuth().currentUser
    if (!user) {
      throw new Error('User not authenticated')
    }
    return user
  }
}
