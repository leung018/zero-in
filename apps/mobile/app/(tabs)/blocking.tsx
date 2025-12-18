// App selection happens in a separate screen
import { TimerBasedSetting } from '@/components/blocking/TimerBasedSetting'
import { WeeklySchedulesEditor } from '@/components/blocking/WeeklySchedulesEditor'
import { commonStyles } from '@/constants/styles'
import { appBlocker, PermissionStatus, PermissionType } from '@/modules/app-blocker'
import { useFocusEffect, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { AppState, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { newWeeklySchedulesStorageService } from '../../domain/schedules/storage'
import { newTimerBasedBlockingRulesStorageService } from '../../domain/timer-based-blocking/storage'

const getPermissionLabel = (permissionType: PermissionType): string => {
  const labels: Record<PermissionType, string> = {
    [PermissionType.FamilyControls]: 'Family Controls',
    [PermissionType.Overlay]: 'Appear on Top',
    [PermissionType.UsageStats]: 'Usage Access'
  }
  return labels[permissionType] || permissionType
}

const getPermissionDescription = (permissionType: PermissionType): string => {
  const descriptions: Record<PermissionType, string> = {
    [PermissionType.FamilyControls]: 'Allow Zero In to block apps using iOS Family Controls.',
    [PermissionType.Overlay]:
      'Allow Zero In to appear on top of other apps to show blocking screens.',
    [PermissionType.UsageStats]: 'Allow Zero In to detect which apps are active for blocking.'
  }
  return descriptions[permissionType] || 'This permission is required for app blocking.'
}

export default function BlockingScreen() {
  const router = useRouter()
  // App Picker handled in separate screen

  // Permission Logic
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>(
    PermissionStatus.empty()
  )
  const appState = useRef(AppState.currentState)

  const checkPermission = useCallback(async () => {
    try {
      const status = await appBlocker.getPermissionStatus()
      setPermissionStatus(status)
    } catch (error) {
      console.error('Failed to check permission status:', error)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      checkPermission()
    }, [checkPermission])
  )

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        checkPermission()
      }
      appState.current = nextAppState
    })

    return () => {
      subscription.remove()
    }
  }, [checkPermission])

  const handleRequestPermission = async (permissionType: PermissionType) => {
    try {
      await appBlocker.requestPermission(permissionType)
    } catch (error) {
      console.error(`Failed to request ${permissionType} permission:`, error)
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Permission Warnings Section */}
        {permissionStatus.getMissingPermissions().map((permissionType) => (
          <TouchableOpacity
            key={permissionType}
            style={styles.permissionBanner}
            onPress={() => handleRequestPermission(permissionType)}
            activeOpacity={0.8}
          >
            <Text style={styles.permissionIcon}>⚠️</Text>
            <View style={styles.permissionTextContainer}>
              <Text style={styles.permissionTitle}>
                {getPermissionLabel(permissionType)} Required
              </Text>
              <Text style={styles.permissionDesc}>{getPermissionDescription(permissionType)}</Text>
            </View>
            <Text style={styles.arrowIcon}>→</Text>
          </TouchableOpacity>
        ))}

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
        />

        {/* Schedules Section */}
        <WeeklySchedulesEditor weeklySchedulesStorageService={newWeeklySchedulesStorageService()} />
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
  permissionBanner: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#fee2e2',
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3
  },
  permissionTextContainer: {
    flex: 1,
    paddingHorizontal: 12
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991b1b',
    marginBottom: 2
  },
  permissionDesc: {
    fontSize: 13,
    color: '#b91c1c',
    lineHeight: 18
  },
  permissionIcon: {
    fontSize: 24
  },
  arrowIcon: {
    fontSize: 20,
    color: '#991b1b',
    fontWeight: '700'
  }
})
