import { NativeModule, requireNativeModule } from 'expo';

import { AppBlockingModuleEvents } from './AppBlocking.types';

declare class AppBlockingModule extends NativeModule<AppBlockingModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<AppBlockingModule>('AppBlocking');
