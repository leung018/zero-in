import AppBlockerModule, { AppPickerView } from '@/modules/app-blocker'
import { useEffect } from 'react'
import { Alert, Button, StyleSheet, View } from 'react-native'

export default function HomeScreen() {
  useEffect(() => {
    const checkService = async () => {
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

  const handleBlockApps = async () => {
    try {
      await AppBlockerModule.blockApps()
      alert('Apps blocked successfully!')
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleUnblockApps = async () => {
    try {
      await AppBlockerModule.unblockApps()
      alert('Apps unblocked successfully!')
    } catch (e: any) {
      alert(e.message)
    }
  }

  return (
    <View style={styles.container}>
      <AppPickerView style={{ flex: 1 }} />
      <View style={styles.buttonContainer}>
        <Button title="Block Apps" onPress={handleBlockApps} />
        <Button title="Unblock Apps" onPress={handleUnblockApps} />
      </View>
    </View>
  )
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
