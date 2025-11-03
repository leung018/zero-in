import { NativeModule, requireNativeModule } from 'expo'

type ConfigureOptions = {
  webClientId: string
}

declare class GoogleSignInModule extends NativeModule {
  configure(options: ConfigureOptions): void

  signIn(): Promise<string>
}

// This call loads the native module object from the JSI.
export default requireNativeModule<GoogleSignInModule>('GoogleSignIn')
