import AppBlockerModule, { AppPickerView } from '@/modules/app-blocker'
import { Button, StyleSheet, View } from 'react-native'

export default function HomeScreen() {
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
    marginVertical: 10,
  }
})
