// App selection happens in a separate screen
import DateTimePicker from '@react-native-community/datetimepicker'
import { useFocusEffect, useRouter } from 'expo-router'
import React, { useCallback, useState } from 'react'
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import appBlocker, { PermissionStatus } from '../../modules/app-blocker/src/AppBlockerModule'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const getPermissionLabel = (permissionType: string): string => {
  const labels: Record<string, string> = {
    familyControls: 'Family Controls',
    overlay: 'Appear on Top',
    usageStats: 'Usage Access'
  }
  return labels[permissionType] || permissionType
}

const getPermissionDescription = (permissionType: string): string => {
  const descriptions: Record<string, string> = {
    familyControls: 'Allow Zero In to block apps during focus sessions using iOS Family Controls.',
    overlay: 'Allow Zero In to appear on top of other apps to show blocking screens.',
    usageStats: 'Allow Zero In to detect which apps are active for blocking.'
  }
  return descriptions[permissionType] || 'This permission is required for app blocking.'
}

interface Schedule {
  weekdays: string[]
  startTime: string
  endTime: string
  targetSessions: string
}

export default function BlockingScreen() {
  const router = useRouter()
  // App Picker handled in separate screen

  // Permission Logic
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>(
    new PermissionStatus({})
  )

  useFocusEffect(
    useCallback(() => {
      const checkPermission = async () => {
        try {
          const status = await appBlocker.getPermissionStatus()
          setPermissionStatus(status)
        } catch (error) {
          console.error('Failed to check permission:', error)
        }
      }
      checkPermission()
    }, [])
  )

  const handleRequestPermission = async (permissionType: string) => {
    try {
      await appBlocker.requestPermission(permissionType)

      // Re-check all permissions after request
      const status = await appBlocker.getPermissionStatus()
      setPermissionStatus(status)
    } catch (error) {
      console.error(`Failed to request ${permissionType} permission:`, error)
      Alert.alert('Error', `Failed to request ${getPermissionLabel(permissionType)} permission`)
    }
  }

  // Timer-Based state
  const [pauseDuringBreaks, setPauseDuringBreaks] = useState(false)
  const [pauseWhenNotRunning, setPauseWhenNotRunning] = useState(false)

  // Schedules state
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [selectedWeekdays, setSelectedWeekdays] = useState<Set<string>>(new Set())
  const [startTime, setStartTime] = useState(new Date())
  const [endTime, setEndTime] = useState(new Date())
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)
  const [targetSessions, setTargetSessions] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showScheduleForm, setShowScheduleForm] = useState(false)

  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const handleSaveTimerBased = () => {
    Alert.alert('Success', 'Timer-based settings saved!')
  }

  const toggleWeekday = (weekday: string) => {
    const newSet = new Set(selectedWeekdays)
    if (newSet.has(weekday)) {
      newSet.delete(weekday)
    } else {
      newSet.add(weekday)
    }
    setSelectedWeekdays(newSet)
  }

  const handleStartTimeChange = (_event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios')
    if (selectedDate) {
      setStartTime(selectedDate)
    }
  }

  const handleEndTimeChange = (_event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios')
    if (selectedDate) {
      setEndTime(selectedDate)
    }
  }

  const handleAddSchedule = () => {
    if (selectedWeekdays.size === 0) {
      setErrorMessage('Please select at least one weekday')
      return
    }

    const startTimeStr = formatTime(startTime)
    const endTimeStr = formatTime(endTime)

    if (startTimeStr >= endTimeStr) {
      setErrorMessage('Start time must be before end time')
      return
    }

    const newSchedule: Schedule = {
      weekdays: Array.from(selectedWeekdays),
      startTime: startTimeStr,
      endTime: endTimeStr,
      targetSessions
    }

    setSchedules([...schedules, newSchedule])

    // Reset form
    setSelectedWeekdays(new Set())
    setStartTime(new Date())
    setEndTime(new Date())
    setTargetSessions('')
    setErrorMessage(null)
    setShowScheduleForm(false)

    Alert.alert('Success', 'Schedule added successfully!')
  }

  const handleCancelAddSchedule = () => {
    setShowScheduleForm(false)
  }

  const handleRemoveSchedule = (indexToRemove: number) => {
    setSchedules(schedules.filter((_, i) => i !== indexToRemove))
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
              Select which apps to block during focus sessions. Your selections are saved
              automatically.
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
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>📅 Schedules</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Configure when blocking is active. Without schedules, blocking runs 24/7 (unless
              paused by settings above).
            </Text>
          </View>

          {!showScheduleForm ? (
            // Show button to add schedule
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowScheduleForm(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>+ Add Schedule</Text>
            </TouchableOpacity>
          ) : (
            // Show schedule form
            <>
              {/* Weekdays Selector */}
              <View style={styles.formSection}>
                <Text style={styles.sectionLabel}>Repeat On</Text>
                <View style={styles.weekdaysGrid}>
                  {WEEKDAYS.map((weekday) => (
                    <TouchableOpacity
                      key={weekday}
                      style={[
                        styles.weekdayChip,
                        selectedWeekdays.has(weekday) && styles.weekdayChipSelected
                      ]}
                      onPress={() => toggleWeekday(weekday)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.weekdayChipText,
                          selectedWeekdays.has(weekday) && styles.weekdayChipTextSelected
                        ]}
                      >
                        {weekday}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Time Range */}
              <View style={styles.formSection}>
                <Text style={styles.sectionLabel}>Time Range</Text>
                <View style={styles.timeRangeContainer}>
                  <View style={styles.timePickerWrapper}>
                    <Text style={styles.timeLabel}>From</Text>
                    <TouchableOpacity
                      style={styles.timePickerButton}
                      onPress={() => setShowStartPicker(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.timePickerText}>{formatTime(startTime)}</Text>
                      <Text style={styles.timePickerIcon}>🕐</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.timeRangeDivider}>
                    <Text style={styles.timeRangeArrow}>→</Text>
                  </View>

                  <View style={styles.timePickerWrapper}>
                    <Text style={styles.timeLabel}>To</Text>
                    <TouchableOpacity
                      style={styles.timePickerButton}
                      onPress={() => setShowEndPicker(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.timePickerText}>{formatTime(endTime)}</Text>
                      <Text style={styles.timePickerIcon}>🕐</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {showStartPicker && (
                  <DateTimePicker
                    value={startTime}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={handleStartTimeChange}
                  />
                )}
                {showEndPicker && (
                  <DateTimePicker
                    value={endTime}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={handleEndTimeChange}
                  />
                )}
              </View>

              {/* Target Sessions */}
              <View style={styles.formSection}>
                <Text style={styles.sectionLabel}>Target Focus Sessions (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={targetSessions}
                  onChangeText={setTargetSessions}
                  placeholder="e.g., 8"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
                <View style={styles.hintBox}>
                  <Text style={styles.hintText}>
                    💡 This schedule deactivates for the rest of that day once the target is met.
                  </Text>
                </View>
              </View>

              {/* Error Message */}
              {errorMessage && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelAddSchedule}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddSchedule}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Saved Schedules */}
          {schedules.length > 0 && (
            <View style={styles.savedSection}>
              <View style={styles.savedHeader}>
                <Text style={styles.savedTitle}>Active</Text>
              </View>

              {schedules.map((schedule, index) => (
                <View key={index} style={styles.scheduleCard}>
                  <View style={styles.scheduleContent}>
                    <Text style={styles.scheduleWeekdays}>{schedule.weekdays.join(', ')}</Text>
                    <Text style={styles.scheduleTime}>
                      {schedule.startTime} - {schedule.endTime}
                    </Text>
                    {schedule.targetSessions && (
                      <View style={styles.targetBadge}>
                        <Text style={styles.targetBadgeText}>
                          🎯 Target sessions: {schedule.targetSessions}
                        </Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleRemoveSchedule(index)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
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
  formSection: {
    marginBottom: 24
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  weekdaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  weekdayChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    minWidth: 60,
    alignItems: 'center'
  },
  weekdayChipSelected: {
    backgroundColor: '#1a73e8',
    borderColor: '#1a73e8'
  },
  weekdayChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280'
  },
  weekdayChipTextSelected: {
    color: '#ffffff'
  },
  timeRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  timePickerWrapper: {
    flex: 1
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff'
  },
  timePickerText: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '700',
    fontVariant: ['tabular-nums']
  },
  timePickerIcon: {
    fontSize: 18
  },
  timeRangeDivider: {
    paddingHorizontal: 12,
    paddingTop: 24
  },
  timeRangeArrow: {
    fontSize: 20,
    color: '#9ca3af',
    fontWeight: '700'
  },
  input: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
    fontWeight: '500'
  },
  hintBox: {
    marginTop: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 10
  },
  hintText: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 16
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  errorIcon: {
    fontSize: 18,
    marginRight: 8
  },
  errorText: {
    flex: 1,
    color: '#991b1b',
    fontSize: 14,
    fontWeight: '600'
  },
  savedSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 2,
    borderTopColor: '#f3f4f6'
  },
  savedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  savedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8
  },
  savedBadge: {
    backgroundColor: '#1a73e8',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    minWidth: 28,
    alignItems: 'center'
  },
  savedBadgeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e5e7eb'
  },
  scheduleContent: {
    flex: 1
  },
  scheduleWeekdays: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6
  },
  scheduleTime: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    marginBottom: 8
  },
  targetBadge: {
    backgroundColor: '#10b981',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start'
  },
  targetBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12
  },
  deleteButtonText: {
    fontSize: 18
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
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 8
  },
  cancelButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600'
  },
  addButton: {
    flex: 1,
    backgroundColor: '#1a73e8',
    paddingVertical: 14,
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
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700'
  },
  appPickerContainer: {
    height: 400,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff'
  },
  appPicker: {
    flex: 1
  }
})
