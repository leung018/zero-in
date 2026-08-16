// App selection happens in a separate screen
import { PermissionBanners } from '@/components/blocking/PermissionBanners'
import { TimerBasedSetting } from '@/components/blocking/TimerBasedSetting'
import { WeeklySchedulesEditor } from '@/components/blocking/WeeklySchedulesEditor'
import { commonStyles } from '@/constants/styles'
import { appBlocker } from '@/modules/app-blocker'
import { useRouter } from 'expo-router'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { newWeeklySchedulesStorageService } from '../../domain/schedules/storage'
import { newTimerBasedBlockingRulesStorageService } from '../../domain/timer-based-blocking/storage'
import { triggerAppBlockToggling } from '../../infra/app-block/toggling-runner'
import { appStateForegroundNotifier } from '../../infra/foreground-notifier'

export default function BlockingScreen() {
  const router = useRouter()
  // App Picker handled in separate screen

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <PermissionBanners
          appBlockerPermissions={appBlocker}
          foregroundNotifier={appStateForegroundNotifier}
        />

        {/* Blocked Apps Section */}
        <View style={commonStyles.card}>
          <View style={commonStyles.sectionHeader}>
            <Text style={commonStyles.cardTitle}>📱 Blocked Apps</Text>
            <View style={commonStyles.divider} />
          </View>

          <View style={commonStyles.infoBox}>
            <Text style={commonStyles.infoText}>
              Select which apps to block. Your selections are saved automatically.
            </Text>
          </View>

          <TouchableOpacity
            style={commonStyles.secondaryButton}
            onPress={() => router.push('/select-apps')}
            activeOpacity={0.8}
          >
            <Text style={commonStyles.secondaryButtonText}>Select Blocked Apps</Text>
          </TouchableOpacity>
        </View>

        {/* Timer-Based Section */}
        <TimerBasedSetting
          timerBasedBlockingRulesStorageService={newTimerBasedBlockingRulesStorageService()}
          triggerAppBlockToggling={triggerAppBlockToggling}
        />

        {/* Schedules Section */}
        <WeeklySchedulesEditor
          weeklySchedulesStorageService={newWeeklySchedulesStorageService()}
          triggerAppBlockToggling={triggerAppBlockToggling}
        />
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
  }
})
