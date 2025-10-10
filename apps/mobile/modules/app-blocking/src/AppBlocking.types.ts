export type AppBlockingModuleEvents = {
  onBlockedAppAttempt: (params: BlockedAppAttemptPayload) => void
}

export type InstalledApp = {
  packageName: string
  label: string
  isSystemApp: boolean
}

export type BlockedAppAttemptPayload = {
  packageName: string
}

export interface AppBlockingInterface {
  requestUsageStatsPermission(): Promise<void>
  getInstalledApps(): Promise<InstalledApp[]>
  setAllowedApps(packages: string[]): Promise<void>
  getAllowedApps(): Promise<string[]>
  checkBlockedApps(): Promise<void>
}
