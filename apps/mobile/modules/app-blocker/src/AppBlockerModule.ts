import { NativeModule, requireNativeModule } from 'expo'

import { AppBlockerModuleEvents } from './AppBlocker.types'

declare class AppBlockerModule extends NativeModule<AppBlockerModuleEvents> {
  getPermissionStatus(): Promise<{
    isGranted: boolean
  }>
  requestPermissions(): Promise<void>
  startService(): Promise<void>
  stopService(): Promise<void>
  blockApps(): Promise<void>
  unblockApps(): Promise<void>
}

// This call loads the native module object from the JSI.
export default requireNativeModule<AppBlockerModule>('AppBlocker')