import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import AppBlocking from '../../modules/app-blocking'
import { InstalledApp } from '../../modules/app-blocking/src/AppBlocking.types'

interface AppBlockingContextType {
  installedApps: InstalledApp[]
  allowedApps: string[]
  isLoading: boolean
  hasPermission: boolean
  requestPermission: () => Promise<void>
  setAllowedApps: (packageNames: string[]) => Promise<void>
  refreshApps: () => Promise<void>
}

const AppBlockingContext = createContext<AppBlockingContextType | null>(null)

export function AppBlockingProvider({ children }: { children: React.ReactNode }) {
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([])
  const [allowedApps, setAllowedApps] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasPermission, setHasPermission] = useState(false)

  const requestPermission = useCallback(async () => {
    try {
      await AppBlocking.requestUsageStatsPermission()
      setHasPermission(true)
    } catch (error) {
      console.error('Failed to request permission:', error)
      setHasPermission(false)
    }
  }, [])

  const refreshApps = useCallback(async () => {
    try {
      setIsLoading(true)
      const apps = await AppBlocking.getInstalledApps()
      const allowed = await AppBlocking.getAllowedApps()
      setInstalledApps(apps)
      setAllowedApps(allowed)
    } catch (error) {
      console.error('Failed to refresh apps:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateAllowedApps = useCallback(async (packageNames: string[]) => {
    try {
      await AppBlocking.setAllowedApps(packageNames)
      setAllowedApps(packageNames)
    } catch (error) {
      console.error('Failed to update allowed apps:', error)
    }
  }, [])

  // Initial load
  useEffect(() => {
    refreshApps()
  }, [refreshApps])

  // Start monitoring blocked apps
  useEffect(() => {
    if (!hasPermission) return

    const subscription = AppBlocking.addListener('onBlockedAppAttempt', (event) => {
      console.log('Blocked app attempt:', event.packageName)
      // You can add notification or UI feedback here
    })

    const interval = setInterval(() => {
      AppBlocking.checkBlockedApps()
    }, 1000)

    return () => {
      subscription.remove()
      clearInterval(interval)
    }
  }, [hasPermission])

  return (
    <AppBlockingContext.Provider
      value={{
        installedApps,
        allowedApps,
        isLoading,
        hasPermission,
        requestPermission,
        setAllowedApps: updateAllowedApps,
        refreshApps
      }}
    >
      {children}
    </AppBlockingContext.Provider>
  )
}

export function useAppBlocking() {
  const context = useContext(AppBlockingContext)
  if (!context) {
    throw new Error('useAppBlocking must be used within an AppBlockingProvider')
  }
  return context
}
