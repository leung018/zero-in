import { NativeModule, requireNativeModule } from 'expo'
declare class GoogleSignInModule extends NativeModule {
  signIn(): Promise<string>
}

// This call loads the native module object from the JSI.
export default requireNativeModule<GoogleSignInModule>('MyGoogleSignIn')
