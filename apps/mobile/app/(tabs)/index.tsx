import { commonStyles } from '@/constants/styles'
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>⏱</Text>
          <Text style={styles.heroTitle}>Zero In</Text>
          <Text style={styles.heroSubtitle}>Focus, powered by your browser</Text>
        </View>

        <View style={commonStyles.card}>
          <View style={commonStyles.sectionHeader}>
            <Text style={commonStyles.cardTitle}>Timer on Mobile</Text>
            <View style={commonStyles.divider} />
          </View>
          <Text style={styles.cardText}>
            Timer control on mobile is coming soon. For now, start your focus sessions from the Zero
            In browser extension — this app will automatically sync and enforce app blocking based
            on your timer.
          </Text>
          <TouchableOpacity
            style={commonStyles.secondaryButton}
            onPress={() => Linking.openURL('https://zeroin.dev')}
            activeOpacity={0.8}
          >
            <Text style={commonStyles.secondaryButtonText}>Get the Extension →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tipBanner}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>
            Avoid swiping this app away from your recent apps — it needs to stay running in the
            background to sync blocking with the extension. If it ever falls out of sync, just bring
            it to the foreground to re-sync.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6'
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 32
  },
  heroIcon: {
    fontSize: 56,
    marginBottom: 12
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: 6
  },
  cardText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5f6368',
    marginBottom: 4
  },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef9c3',
    borderWidth: 1,
    borderColor: '#fde047',
    borderRadius: 16,
    padding: 14,
    gap: 10
  },
  tipIcon: {
    fontSize: 20,
    lineHeight: 22
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#854d0e'
  }
})
