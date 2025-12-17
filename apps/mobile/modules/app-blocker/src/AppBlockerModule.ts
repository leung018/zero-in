import { NativeModule, requireNativeModule } from 'expo'

export enum PermissionType {
  FamilyControls = 'familyControls',
  Overlay = 'overlay',
  UsageStats = 'usageStats'
}

interface PermissionDetails {
  [key: string]: boolean
}

export class PermissionStatus {
  constructor(public readonly details: PermissionDetails) {}

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

  static fromNativeResponse(details: PermissionDetails): PermissionStatus {
    return new PermissionStatus(details)
  }
}

declare class AppBlockerModule extends NativeModule {
  getPermissionDetails(): Promise<PermissionDetails>
  requestPermission(permissionType: PermissionType): Promise<void>
  blockApps(): Promise<void>
  unblockApps(): Promise<void>
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
  }
}
