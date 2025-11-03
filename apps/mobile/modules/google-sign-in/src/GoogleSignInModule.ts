import { NativeModule, requireNativeModule } from 'expo';

import { GoogleSignInModuleEvents } from './GoogleSignIn.types';

declare class GoogleSignInModule extends NativeModule<GoogleSignInModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<GoogleSignInModule>('GoogleSignIn');
