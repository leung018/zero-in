import {
  onScheduleEndNotificationTapped,
  triggerAppBlockToggling
} from '@/infra/app-block/toggling-runner'
import { Ionicons } from '@expo/vector-icons'
import * as Notifications from 'expo-notifications'
import { Tabs } from 'expo-router'
import { useEffect, useState } from 'react'
import { AppState, TouchableOpacity, View } from 'react-native'
import { SideMenu } from '../../components/side-menu'
import { newTimerStateStorageService } from '../../domain/timer/state/storage'
import { createLogger } from '../../utils/logger'

const log = createLogger('TabLayout')

export default function TabLayout() {
  const [menuVisible, setMenuVisible] = useState(false)
  const lastNotificationResponse = Notifications.useLastNotificationResponse()

  useEffect(() => {
    if (lastNotificationResponse) {
      onScheduleEndNotificationTapped(lastNotificationResponse)
      Notifications.clearLastNotificationResponse()
    }
  }, [lastNotificationResponse])

  useEffect(() => {
    const syncBlocking = (reason: string) => {
      log.info(`${reason} sync triggered`)
      triggerAppBlockToggling().catch((err) => {
        log.error(`${reason} sync blocking failed:`, err)
      })
    }

    syncBlocking('Initial')

    // Listen for notification taps that trigger app blocking service
    const notificationResponseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        log.debug('Notification response received:', response)
        onScheduleEndNotificationTapped(response)
      }
    )

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        syncBlocking('Foreground')
      }
    })

    // Listen for timerState change from remote
    const timerStateStorageService = newTimerStateStorageService()
    timerStateStorageService
      .onChange(() => {
        // In background, the app-block-sync push handles the sync. Overlapping runs from here may get
        // cut off when iOS suspends the app after the push task completes.
        if (AppState.currentState !== 'active') {
          log.info('Timer state onChange sync skipped in background')
          return
        }
        log.info('Timer state onChange sync triggered')
        return triggerAppBlockToggling()
      })
      .catch((err) => {
        log.error('Failed to subscribe to timer state:', err)
      })

    return () => {
      appStateSubscription.remove()
      notificationResponseListener.remove()
      timerStateStorageService.unsubscribeAll()
    }
  }, [])

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#8E8E93',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E5E5EA'
          },
          headerShown: false
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Timer',
            tabBarIcon: ({ color, size }) => <Ionicons name="timer" size={size} color={color} />
          }}
        />
        <Tabs.Screen
          name="blocking"
          options={{
            title: 'Blocking',
            tabBarIcon: ({ color, size }) => <Ionicons name="ban" size={size} color={color} />
          }}
        />
        <Tabs.Screen
          name="statistics"
          options={{
            title: 'Statistics',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="stats-chart" size={size} color={color} />
            ),
            tabBarButton: ({ children, style }) => (
              <View style={[style, { opacity: 0.4 }]} pointerEvents="none">
                {children}
              </View>
            )
          }}
        />
        <Tabs.Screen
          name="menu"
          options={{
            title: 'Menu',
            tabBarIcon: ({ color, size }) => <Ionicons name="menu" size={size} color={color} />,
            tabBarButton: (props) => {
              const { children, style, accessibilityLabel, testID } = props as any
              return (
                <TouchableOpacity
                  style={style}
                  onPress={() => setMenuVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel={accessibilityLabel ?? 'Open more menu'}
                  testID={testID}
                  activeOpacity={0.7}
                >
                  {children}
                </TouchableOpacity>
              )
            }
          }}
        />
      </Tabs>

      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </View>
  )
}
