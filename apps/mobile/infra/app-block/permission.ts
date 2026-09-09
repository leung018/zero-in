import {
  PermissionDetails,
  PermissionStatus,
  PermissionType
} from '@/modules/app-blocker/src/permission'

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
