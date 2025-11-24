import {
  connectFunctionsEmulator,
  getFunctions,
  httpsCallable
} from '@react-native-firebase/functions'
import { useEffect } from 'react'
import { Alert, Button, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppBlockerModule, { AppPickerView } from '../../modules/app-blocker'

import * as Notifications from 'expo-notifications'

// Call Firebase Cloud Function
const functions = getFunctions()

// Connect to emulator in development
if (__DEV__) {
  // Replace with your Computer IP address (find it with: ifconfig | grep "inet " | grep -v 127.0.0.1)
  const HOST_IP = '192.168.1.18'
  connectFunctionsEmulator(functions, HOST_IP, 5001)
  console.log('Connected to Functions emulator')
}

export default function BlockingScreen() {
  useEffect(() => {
    const checkService = async () => {
      await Notifications.requestPermissionsAsync()

      const status = await AppBlockerModule.getPermissionStatus()
      if (!status.isGranted) {
        Alert.alert('Permission Required', 'Please enable the required permissions', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enable', onPress: () => AppBlockerModule.requestPermissions() }
        ])
      }
    }
    checkService()
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <AppPickerView style={{ flex: 1 }} />
      <View style={styles.buttonContainer}>
        <Button title="Schedule block" onPress={handleBlockApps} />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Unblock Apps" onPress={() => AppBlockerModule.unblockApps()} />
      </View>
    </SafeAreaView>
  )
}

const handleBlockApps = async () => {
  console.log('Scheduling notification to block apps...')

  try {
    // Get FCM token
    const token = await Notifications.getDevicePushTokenAsync()
    console.log('FCM Token:', token.data)

    const result = await httpsCallable(functions, 'triggerAppBlocking')({ fcmToken: token.data })
    console.log('Remote notification sent:', result.data)

    Alert.alert(
      'Notification Sent',
      'Remote notification sent! Check if apps get blocked after 5 seconds.',
      [{ text: 'OK' }]
    )
  } catch (error) {
    console.error('Error triggering remote notification:', error)
    Alert.alert('Error', 'Failed to send remote notification. Check console.')
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10
  }
})
