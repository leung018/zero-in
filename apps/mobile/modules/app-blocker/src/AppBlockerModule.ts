import { NativeModule, requireNativeModule } from 'expo'

export interface PermissionDetails {
  [key: string]: boolean
}

export class PermissionStatus {
  constructor(public readonly details: PermissionDetails) {}

  get isGranted(): boolean {
    return Object.values(this.details).every((granted) => granted === true)
  }

  hasPermission(type: string): boolean {
    return this.details[type] === true
  }

  getMissingPermissions(): string[] {
    return Object.entries(this.details)
      .filter(([_, granted]) => !granted)
      .map(([type, _]) => type)
  }

  // Factory method to create from native response
  static fromNativeResponse(details: PermissionDetails): PermissionStatus {
    return new PermissionStatus(details)
  }
}

declare class AppBlockerModule extends NativeModule {
  getPermissionDetails(): Promise<PermissionDetails>
  requestPermission(permissionType: string): Promise<void>
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
  requestPermission(permissionType: string): Promise<void> {
    return nativeModule.requestPermission(permissionType)
  },
  blockApps(): Promise<void> {
    return nativeModule.blockApps()
  },
  unblockApps(): Promise<void> {
    return nativeModule.unblockApps()
  }
}

// Default export is the wrapper, not the raw native module
export default appBlocker
