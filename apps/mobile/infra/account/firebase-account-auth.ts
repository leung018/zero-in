import { deleteUser, reauthenticateWithCredential, User } from '@react-native-firebase/auth'
import { AccountAuth, ReauthResult } from './interface'
import { SignInProvider } from './sign-in-provider'

export class FirebaseAccountAuth implements AccountAuth {
  constructor(private readonly deps: { user: User; signInProvider: SignInProvider }) {}

  async reauthenticate(): Promise<ReauthResult> {
    const credential = await this.deps.signInProvider.getCredential()
    if (!credential) return 'cancelled'

    await reauthenticateWithCredential(this.deps.user, credential)
    return 'reauthenticated'
  }

  async deleteUser(): Promise<void> {
    await this.deps.signInProvider.beforeDeleteUser()
    await deleteUser(this.deps.user)
  }
}
