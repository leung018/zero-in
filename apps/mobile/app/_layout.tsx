import { Stack, useRouter } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

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

  // Navigate to appropriate screen once ready
  useEffect(() => {
    if (isReady) {
      if (isLoggedIn) {
        router.replace('/home')
      } else {
        router.replace('/login')
      }
    }
  }, [isReady, isLoggedIn, router])

  if (!isReady) {
    return null
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="home" />
      </Stack>
    </SafeAreaProvider>
  )
}
