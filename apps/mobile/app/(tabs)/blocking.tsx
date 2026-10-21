// App selection happens in a separate screen
import { PermissionBanners } from '@/components/blocking/PermissionBanners'
import { TimerBasedSetting } from '@/components/blocking/TimerBasedSetting'
import { WeeklySchedulesEditor } from '@/components/blocking/WeeklySchedulesEditor'
import { commonStyles } from '@/constants/styles'
import { appBlocker } from '@/modules/app-blocker'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { newWeeklySchedulesStorageService } from '../../domain/schedules/storage'
import { newTimerBasedBlockingRulesStorageService } from '../../domain/timer-based-blocking/storage'
import { triggerAppBlockToggling } from '../../infra/app-block/toggling-runner'
import { appStateForegroundNotifier } from '../../infra/foreground-notifier'

export default function BlockingScreen() {
  const router = useRouter()
  const [requiredPermissionsGranted, setRequiredPermissionsGranted] = useState(true)
  // App Picker handled in separate screen

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <PermissionBanners
          appBlockerPermissions={appBlocker}
          foregroundNotifier={appStateForegroundNotifier}
          triggerAppBlockToggling={triggerAppBlockToggling}
          onRequiredPermissionsGrantedChange={setRequiredPermissionsGranted}
        />

        <View style={commonStyles.infoBox}>
          <Text style={commonStyles.infoText}>
            If blocking isn&apos;t behaving as expected, open Zero In to sync it.
            {Platform.OS === 'ios' &&
              ' On iOS, avoid swiping Zero In away in the app switcher — that pauses background sync.'}
          </Text>
        </View>

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

          {!requiredPermissionsGranted && (
            <Text style={styles.permissionReminder}>Grant the required permissions first.</Text>
          )}

          <TouchableOpacity
            style={[
              commonStyles.secondaryButton,
              !requiredPermissionsGranted && styles.disabledButton
            ]}
            onPress={() => router.push('/select-apps')}
            disabled={!requiredPermissionsGranted}
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
  },
  permissionReminder: {
    fontSize: 13,
    color: '#b91c1c',
    marginBottom: 8
  },
  disabledButton: {
    opacity: 0.5
  }
})
