import { useEffect } from 'react'
import { Alert, Button, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppBlockerModule, { AppPickerView } from '../../modules/app-blocker'

import * as Notifications from 'expo-notifications'

Notifications.setNotificationHandler({
  handleNotification: async () => {
    console.log('Handling notification to block apps')
    await AppBlockerModule.blockApps()
    return {
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true
    }
  }
})

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
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Look at that notification',
      body: "I'm so proud of myself!"
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(Date.now() + 5000)
    }
  })
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
