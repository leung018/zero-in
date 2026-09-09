export enum PermissionType {
  FamilyControls = 'familyControls',
  Overlay = 'overlay',
  UsageStats = 'usageStats',
  ExactAlarm = 'exactAlarm',
  IgnoreBatteryOptimizations = 'ignoreBatteryOptimizations'
}

export interface PermissionDetails {
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
