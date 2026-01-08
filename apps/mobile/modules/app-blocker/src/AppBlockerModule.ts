import { NativeModule, requireNativeModule } from 'expo'
import { ScheduleSpan } from '../../../domain/schedules/schedule-span'

export enum PermissionType {
  FamilyControls = 'familyControls',
  Overlay = 'overlay',
  UsageStats = 'usageStats'
}

interface PermissionDetails {
  [key: string]: boolean
}

export class PermissionStatus {
  static fromNativeResponse(details: PermissionDetails): PermissionStatus {
    return new PermissionStatus(details)
  }

  static empty(): PermissionStatus {
    return new PermissionStatus({})
  }

  private constructor(public readonly details: PermissionDetails) {}

  get isGranted(): boolean {
    return Object.values(this.details).every((granted) => granted === true)
  }

  hasPermission(type: PermissionType): boolean {
    return this.details[type] === true
  }

  getMissingPermissions(): PermissionType[] {
    return Object.entries(this.details)
      .filter(([_, granted]) => !granted)
      .map(([type, _]) => type as PermissionType)
  }
}

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
export const appBlocker = {
  async getPermissionStatus(): Promise<PermissionStatus> {
    const response = await nativeModule.getPermissionDetails()
    return PermissionStatus.fromNativeResponse(response)
  },
  requestPermission(permissionType: PermissionType): Promise<void> {
    return nativeModule.requestPermission(permissionType)
  },
  blockApps(): Promise<void> {
    return nativeModule.blockApps()
  },
  unblockApps(): Promise<void> {
    return nativeModule.unblockApps()
  },
  setSchedule(scheduleSpan: ScheduleSpan): Promise<void> {
    return nativeModule.setSchedule(scheduleSpan.start.getTime(), scheduleSpan.end.getTime())
  },
  clearSchedule(): Promise<void> {
    return nativeModule.clearSchedule()
  }
}
