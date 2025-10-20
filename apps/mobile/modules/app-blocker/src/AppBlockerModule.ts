import { NativeModule, requireNativeModule } from 'expo'

declare class AppBlockerModule extends NativeModule<{}> {
  getPermissionStatus(): Promise<{
    isGranted: boolean
  }>
  requestPermissions(): Promise<void>
  blockApps(): Promise<void>
  unblockApps(): Promise<void>
}

// This call loads the native module object from the JSI.
export default requireNativeModule<AppBlockerModule>('AppBlocker')
