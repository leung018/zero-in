import { NativeModule, requireNativeModule } from 'expo'

import { AppBlockerModuleEvents } from './AppBlocker.types'

declare class AppBlockerModule extends NativeModule<AppBlockerModuleEvents> {
  blockApps(): Promise<void>
  unblockApps(): Promise<void>
}

// This call loads the native module object from the JSI.
export default requireNativeModule<AppBlockerModule>('AppBlocker')
