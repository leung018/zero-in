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

export interface AppBlockerPermissions {
  getPermissionStatus(): Promise<PermissionStatus>
  requestPermission(permissionType: PermissionType): Promise<void>
}

export class FakeAppBlockerPermissions implements AppBlockerPermissions {
  private details: PermissionDetails
  private grantOnRequest: boolean

  constructor({
    details = {},
    grantOnRequest = true
  }: {
    details?: PermissionDetails
    /**
     * iOS grants within the app, so the request resolves once granted.
     * Android sends the user to system settings, so it is still missing when the request resolves.
     */
    grantOnRequest?: boolean
  } = {}) {
    this.details = { ...details }
    this.grantOnRequest = grantOnRequest
  }

  async getPermissionStatus(): Promise<PermissionStatus> {
    return PermissionStatus.fromNativeResponse(this.details)
  }

  async requestPermission(permissionType: PermissionType): Promise<void> {
    if (this.grantOnRequest) {
      this.grant(permissionType)
    }
  }

  grant(permissionType: PermissionType) {
    this.details = { ...this.details, [permissionType]: true }
  }
}
