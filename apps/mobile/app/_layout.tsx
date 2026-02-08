import {
  onScheduleEndNotificationTapped,
  triggerAppBlockToggling
} from '@/infra/app-block/toggling-runner'
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth'
import * as Notifications from 'expo-notifications'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { createLogger } from '../utils/logger'

SplashScreen.preventAutoHideAsync()

const log = createLogger('RootLayout')

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Request notification permissions on startup
    requestNotificationPermissions().catch((err) => {
      log.error('Failed to request notification permissions:', err)
    })

    // Sync blocking schedules on app startup
    triggerAppBlockToggling().catch((err) => {
      log.error('Initial sync failed:', err)
    })

    // Listen for notification taps that trigger app blocking service
    const notificationResponseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        log.debug('Notification response received:', response)
        onScheduleEndNotificationTapped(response)
      }
    )

    const unsubscribe = onAuthStateChanged(getAuth(), async (user) => {
      setIsAuthenticated(user != null)
      setIsReady(true)
      await SplashScreen.hideAsync()
    })

    return () => {
      unsubscribe()
      notificationResponseListener.remove()
    }
  }, [])

  if (!isReady) {
    return null
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
      </Stack>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  )
}

// TODO: Think better way to organize request permissions related logic.

/**
 * Requests notification permissions from the user.
 * Should be called at app startup.
 *
 * @returns true if permissions were granted, false otherwise
 */
async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      log.warn('Notification permissions not granted')
      return false
    }

    return true
  } catch (error) {
    log.error('Failed to request notification permissions:', error)
    return false
  }
}
