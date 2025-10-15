import { AppPickerView } from '@/modules/app-blocker'
import { StyleSheet, View } from 'react-native'

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <AppPickerView style={{ flex: 1 }} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
})
