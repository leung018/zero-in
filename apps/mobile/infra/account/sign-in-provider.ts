import {
  AuthCredential,
  EmailAuthProvider,
  getAuth,
  revokeToken
} from '@react-native-firebase/auth'
import { getAppleCredential, getGoogleCredential } from '../firebase/auth-credentials'

export interface SignInProvider {
  getCredential(): Promise<AuthCredential | null>
  beforeDeleteUser(): Promise<void>
}

export class GoogleSignInProvider implements SignInProvider {
  async getCredential(): Promise<AuthCredential | null> {
    return getGoogleCredential()
  }

  async beforeDeleteUser(): Promise<void> {}
}

export class EmailSignInProvider implements SignInProvider {
  constructor(
    private readonly deps: { email: string; promptPassword: () => Promise<string | null> }
  ) {}

  async getCredential(): Promise<AuthCredential | null> {
    const password = await this.deps.promptPassword()
    if (password === null) return null

    return EmailAuthProvider.credential(this.deps.email, password)
  }

  async beforeDeleteUser(): Promise<void> {}
}

export class AppleSignInProvider implements SignInProvider {
  private authorizationCode: string | null = null

  async getCredential(): Promise<AuthCredential | null> {
    const result = await getAppleCredential()
    if (!result) return null

    this.authorizationCode = result.authorizationCode
    return result.credential
  }

  async beforeDeleteUser(): Promise<void> {
    if (!this.authorizationCode) return

    try {
      await revokeToken(getAuth(), this.authorizationCode)
    } catch (error) {
      console.error('Failed to revoke Apple token:', error)
    }
  }
}
