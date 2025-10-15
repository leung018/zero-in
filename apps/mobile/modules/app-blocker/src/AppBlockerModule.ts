import { NativeModule, requireNativeModule } from 'expo'

import { AppBlockerModuleEvents } from './AppBlocker.types'

declare class AppBlockerModule extends NativeModule<AppBlockerModuleEvents> {
  getPermissionStatus(): Promise<{
    isEnabled: boolean
    prompt?: { title: string; message: string }
  }>
  requestPermission(): Promise<void>
  blockApps(): Promise<void>
  unblockApps(): Promise<void>
}

// This call loads the native module object from the JSI.
export default requireNativeModule<AppBlockerModule>('AppBlocker')
