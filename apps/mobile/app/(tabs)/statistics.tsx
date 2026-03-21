import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function StatisticsScreen() {
  return <SafeAreaView style={styles.container} edges={['left', 'right']} />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  }
})
