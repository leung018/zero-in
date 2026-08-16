import { ScheduleSpan } from '@zero-in/shared/domain/schedules'
import { NativeModule, requireNativeModule } from 'expo'
import {
  AppBlockerPermissions,
  PermissionDetails,
  PermissionStatus,
  PermissionType
} from './permission'

declare class AppBlockerModule extends NativeModule {
  getPermissionDetails(): Promise<PermissionDetails>
  requestPermission(permissionType: PermissionType): Promise<void>
  blockApps(): Promise<void>
  unblockApps(): Promise<void>
  setSchedule(startTime: number, endTime: number): Promise<void>
  clearSchedule(): Promise<void>
}

const nativeModule = requireNativeModule<AppBlockerModule>('AppBlocker')

// Thin wrapper to always return PermissionStatus and encapsulate native calls
export const appBlocker: AppBlockerPermissions & {
  enableAlwaysBlock(): Promise<void>
  disableAlwaysBlock(): Promise<void>
  setBlockingSchedule(scheduleSpan: ScheduleSpan): Promise<void>
  clearBlockingSchedule(): Promise<void>
} = {
  async getPermissionStatus(): Promise<PermissionStatus> {
    const response = await nativeModule.getPermissionDetails()
    return PermissionStatus.fromNativeResponse(response)
  },

  requestPermission(permissionType: PermissionType): Promise<void> {
    return nativeModule.requestPermission(permissionType)
  },

  enableAlwaysBlock(): Promise<void> {
    return nativeModule.blockApps()
  },

  disableAlwaysBlock(): Promise<void> {
    return nativeModule.unblockApps()
  },

  setBlockingSchedule(scheduleSpan: ScheduleSpan): Promise<void> {
    return nativeModule.setSchedule(scheduleSpan.start.getTime(), scheduleSpan.end.getTime())
  },

  clearBlockingSchedule(): Promise<void> {
    return nativeModule.clearSchedule()
  }
}
