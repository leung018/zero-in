// App selection happens in a separate screen
import { WeeklySchedulesEditor } from '@/components/blocking/WeeklySchedulesEditor'
import {
  appBlocker,
  PermissionStatus,
  PermissionType
} from '@/modules/app-blocker/src/AppBlockerModule'
import { useFocusEffect, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  AppState,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { newWeeklySchedulesStorageService } from '../../domain/schedules/storage'

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
    new PermissionStatus({})
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

  // Timer-Based state
  const [pauseDuringBreaks, setPauseDuringBreaks] = useState(false)
  const [pauseWhenNotRunning, setPauseWhenNotRunning] = useState(false)

  const handleSaveTimerBased = () => {
    Alert.alert('Success', 'Timer-based settings saved!')
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
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>📱 Blocked Apps</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Select which apps to block. Your selections are saved automatically.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/select-apps')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Select Blocked Apps</Text>
          </TouchableOpacity>
        </View>

        {/* Timer-Based Section */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>⏱️ Timer-Based</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.settingsContainer}>
            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Pause During Breaks</Text>
                <Text style={styles.settingDescription}>Stop blocking during breaks</Text>
              </View>
              <Switch
                value={pauseDuringBreaks}
                onValueChange={setPauseDuringBreaks}
                trackColor={{ false: '#e5e7eb', true: '#bfdbfe' }}
                thumbColor={pauseDuringBreaks ? '#1a73e8' : '#ffffff'}
                ios_backgroundColor="#e5e7eb"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Pause When Not Running</Text>
                <Text style={styles.settingDescription}>
                  Stop blocking when timer is not running
                </Text>
              </View>
              <Switch
                value={pauseWhenNotRunning}
                onValueChange={setPauseWhenNotRunning}
                trackColor={{ false: '#e5e7eb', true: '#bfdbfe' }}
                thumbColor={pauseWhenNotRunning ? '#1a73e8' : '#ffffff'}
                ios_backgroundColor="#e5e7eb"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleSaveTimerBased}>
            <Text style={styles.primaryButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

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
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5
  },
  sectionHeader: {
    marginBottom: 20
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12
  },
  divider: {
    height: 3,
    backgroundColor: '#1a73e8',
    borderRadius: 2,
    width: 40
  },
  settingsContainer: {
    marginBottom: 20
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4
  },
  settingDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18
  },
  primaryButton: {
    backgroundColor: '#1a73e8',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#1a73e8',
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 4,
    borderLeftColor: '#1a73e8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#1e40af'
  },
  secondaryButton: {
    backgroundColor: '#e1f5fe',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a73e8',
    marginTop: 16
  },
  secondaryButtonText: {
    color: '#1a73e8',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5
  }
})
