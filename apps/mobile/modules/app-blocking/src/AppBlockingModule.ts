import { NativeModule, requireNativeModule } from 'expo'
import { AppBlockingInterface, AppBlockingModuleEvents, InstalledApp } from './AppBlocking.types'

declare class AppBlockingModule
  extends NativeModule<AppBlockingModuleEvents>
  implements AppBlockingInterface
{
  requestUsageStatsPermission(): Promise<void>
  getInstalledApps(): Promise<InstalledApp[]>
  setAllowedApps(packages: string[]): Promise<void>
  getAllowedApps(): Promise<string[]>
  checkBlockedApps(): Promise<void>
}

// This call loads the native module object from the JSI.
export default requireNativeModule<AppBlockingModule>('AppBlocking')
