import { commonStyles } from '@/constants/styles'
import DateTimePicker from '@react-native-community/datetimepicker'
import { WeeklySchedule } from '@zero-in/shared/domain/schedules'
import { WeeklySchedulesStorageService } from '@zero-in/shared/domain/schedules/storage'
import { Weekday, WEEKDAYS } from '@zero-in/shared/domain/schedules/weekday'
import { Time } from '@zero-in/shared/domain/time'
import { capitalized } from '@zero-in/shared/utils/format'
import React, { useEffect, useState } from 'react'
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

const formatWeekday = (weekday: Weekday): string => {
  return capitalized(Weekday[weekday])
}

const formatWeekdays = (weekdaySet: ReadonlySet<Weekday>): string => {
  return Array.from(weekdaySet).map(formatWeekday).join(', ')
}

export function WeeklySchedulesEditor({
  weeklySchedulesStorageService,
  triggerAppBlockToggling
}: {
  weeklySchedulesStorageService: WeeklySchedulesStorageService
  triggerAppBlockToggling: () => Promise<void>
}) {
  // Schedules state
  const [weeklySchedules, setWeeklySchedules] = useState<WeeklySchedule[]>([])
  const [selectedWeekdays, setSelectedWeekdays] = useState<Set<Weekday>>(new Set())
  const [startTime, setStartTime] = useState(new Date())
  const [endTime, setEndTime] = useState(new Date())
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)
  const [targetSessions, setTargetSessions] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showScheduleForm, setShowScheduleForm] = useState(false)

  // Load schedules from storage on mount
  useEffect(() => {
    weeklySchedulesStorageService.get().then((schedules) => {
      if (schedules) {
        setWeeklySchedules(schedules)
      }
    })
  }, [weeklySchedulesStorageService])

  const toggleWeekday = (weekday: Weekday) => {
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

  const handleAddSchedule = async () => {
    if (selectedWeekdays.size === 0) {
      setErrorMessage('Please select at least one weekday')
      return
    }

    // Convert selected weekdays (strings) to Weekday enum
    const weekdaySet = new Set<Weekday>()
    for (const weekdayStr of selectedWeekdays) {
      const weekdayIndex = WEEKDAYS.indexOf(weekdayStr)
      if (weekdayIndex !== -1) {
        weekdaySet.add(weekdayIndex as Weekday)
      }
    }

    const startTimeObj = new Time(startTime.getHours(), startTime.getMinutes())
    const endTimeObj = new Time(endTime.getHours(), endTime.getMinutes())

    if (!startTimeObj.isBefore(endTimeObj)) {
      setErrorMessage('Start time must be before end time')
      return
    }

    const targetFocusSessions = targetSessions ? parseInt(targetSessions, 10) : undefined

    const newSchedule = new WeeklySchedule({
      weekdaySet: selectedWeekdays,
      startTime: startTimeObj,
      endTime: endTimeObj,
      targetFocusSessions:
        targetFocusSessions && targetFocusSessions > 0 ? targetFocusSessions : null
    })

    const newWeeklySchedules = [...weeklySchedules, newSchedule]
    await updateWeeklySchedules(newWeeklySchedules)

    // Reset form
    setSelectedWeekdays(new Set())
    setStartTime(new Date())
    setEndTime(new Date())
    setTargetSessions('')
    setErrorMessage(null)
    setShowScheduleForm(false)
  }

  const handleCancelAddSchedule = () => {
    setShowScheduleForm(false)
  }

  const handleRemoveSchedule = async (indexToRemove: number) => {
    const newWeeklySchedules = weeklySchedules.filter((_, i) => i !== indexToRemove)
    await updateWeeklySchedules(newWeeklySchedules)
  }

  const updateWeeklySchedules = async (newWeeklySchedules: WeeklySchedule[]) => {
    await weeklySchedulesStorageService.save(newWeeklySchedules)
    setWeeklySchedules(newWeeklySchedules)
    triggerAppBlockToggling()
  }

  return (
    <View style={commonStyles.card}>
      <View style={commonStyles.sectionHeader}>
        <Text style={commonStyles.cardTitle}>📅 Schedules</Text>
        <View style={commonStyles.divider} />
      </View>

      <View style={commonStyles.infoBox}>
        <Text style={commonStyles.infoText}>
          Configure when blocking is active. Without schedules, blocking runs 24/7 (unless paused by
          settings above).
        </Text>
      </View>

      {!showScheduleForm ? (
        // Show button to add schedule
        <TouchableOpacity
          testID="show-add-schedule-button"
          style={commonStyles.secondaryButton}
          onPress={() => setShowScheduleForm(true)}
          activeOpacity={0.8}
        >
          <Text style={commonStyles.secondaryButtonText}>+ Add Schedule</Text>
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
                  testID={`check-weekday-${Weekday[weekday].toLowerCase()}`}
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
                    testID="weekday-label"
                  >
                    {capitalized(Weekday[weekday])}
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
                  testID="start-time-button"
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
                  testID="end-time-button"
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
                testID="start-time-picker"
                value={startTime}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={handleStartTimeChange}
              />
            )}
            {showEndPicker && (
              <DateTimePicker
                testID="end-time-picker"
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
              testID="target-focus-sessions-input"
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
              <Text style={styles.errorText} testID="error-message">
                {errorMessage}
              </Text>
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
              testID="add-schedule-button"
              style={styles.addButton}
              onPress={handleAddSchedule}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Active Schedules */}
      {weeklySchedules.length > 0 && (
        <View style={styles.savedSection} testID="active-schedules-section">
          <View style={styles.savedHeader}>
            <Text style={styles.savedTitle}>Active</Text>
          </View>

          {weeklySchedules.map((schedule, index) => (
            <View key={index} style={styles.scheduleCard} testID="weekly-schedule">
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleWeekdays}>{formatWeekdays(schedule.weekdaySet)}</Text>
                <Text style={styles.scheduleTime}>
                  {schedule.startTime.toHhMmString()} - {schedule.endTime.toHhMmString()}
                </Text>
                {schedule.targetFocusSessions && (
                  <View style={styles.targetBadge}>
                    <Text style={styles.targetBadgeText} testID="target-focus-sessions">
                      🎯 Target sessions: {schedule.targetFocusSessions}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                testID={`remove-schedule-with-index-${index}`}
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
  )
}

const styles = StyleSheet.create({
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
  }
})
