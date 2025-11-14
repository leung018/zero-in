import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const prepareApp = async () => {
      try {
        // TODO: Check if user is logged in
      } catch (e) {
        console.warn(e)
      } finally {
        setIsReady(true)
        await SplashScreen.hideAsync()
      }
    }

    prepareApp()
  }, [])

  if (!isReady) {
    return null
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={isLoggedIn}>
          <Stack.Screen name="index" />
        </Stack.Protected>
        <Stack.Protected guard={!isLoggedIn}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
      </Stack>
    </SafeAreaProvider>
  )
}
