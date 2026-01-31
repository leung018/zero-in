import { triggerAppBlockTogglingSync } from '@/infra/background-tasks'
import { requestNotificationPermissions } from '@/infra/notification-scheduler'
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth'
import * as Notifications from 'expo-notifications'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Request notification permissions on startup
    requestNotificationPermissions().catch((err) => {
      console.error('[RootLayout] Failed to request notification permissions:', err)
    })

    // Sync blocking schedules on app startup
    triggerAppBlockTogglingSync().catch((err) => {
      console.error('[RootLayout] Initial sync failed:', err)
    })

    // Listen for notification taps that trigger app blocking service
    const notificationResponseListener = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const triggerSource = response.notification.request.content.data?.triggerSource
        if (triggerSource === 'schedule-end') {
          console.log('[RootLayout] Notification tapped, triggering sync')
          await triggerAppBlockTogglingSync()
        }
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
