import DateTimePicker from '@react-native-community/datetimepicker'
import React, { useState } from 'react'
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

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Schedule {
  weekdays: string[]
  startTime: string
  endTime: string
  targetSessions: string
}

export default function BlockingScreen() {
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
      setErrorMessage('Please select weekdays')
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

    Alert.alert('Success', 'Schedule added!')
  }

  const handleRemoveSchedule = (indexToRemove: number) => {
    setSchedules(schedules.filter((_, i) => i !== indexToRemove))
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Timer-Based Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Timer-Based</Text>
          <View style={styles.checkboxContainer}>
            <View style={styles.checkboxRow}>
              <Text style={styles.checkboxLabel}>Pause blocking during breaks</Text>
              <Switch
                value={pauseDuringBreaks}
                onValueChange={setPauseDuringBreaks}
                trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                thumbColor={pauseDuringBreaks ? '#1a73e8' : '#f4f4f4'}
              />
            </View>
            <View style={styles.checkboxRow}>
              <Text style={styles.checkboxLabel}>Pause blocking when timer is not running</Text>
              <Switch
                value={pauseWhenNotRunning}
                onValueChange={setPauseWhenNotRunning}
                trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                thumbColor={pauseWhenNotRunning ? '#1a73e8' : '#f4f4f4'}
              />
            </View>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleSaveTimerBased}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Schedules Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Schedules</Text>
          <Text style={styles.helperText}>
            Set the schedules for blocking access to the configured apps. If not set, blocking
            remains active 24/7 (unless paused by settings above).
          </Text>

          {/* Weekdays Selector */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Repeat Schedule On:</Text>
            <View style={styles.weekdaysContainer}>
              {WEEKDAYS.map((weekday) => (
                <TouchableOpacity
                  key={weekday}
                  style={[
                    styles.weekdayButton,
                    selectedWeekdays.has(weekday) && styles.weekdayButtonSelected
                  ]}
                  onPress={() => toggleWeekday(weekday)}
                >
                  <Text
                    style={[
                      styles.weekdayButtonText,
                      selectedWeekdays.has(weekday) && styles.weekdayButtonTextSelected
                    ]}
                  >
                    {weekday}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Start Time */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Start Time:</Text>
            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={styles.timePickerText}>{formatTime(startTime)}</Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={startTime}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleStartTimeChange}
              />
            )}
          </View>

          {/* End Time */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>End Time:</Text>
            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={styles.timePickerText}>{formatTime(endTime)}</Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={endTime}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleEndTimeChange}
              />
            )}
          </View>

          {/* Target Focus Sessions */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Target Number of Focus Sessions (optional):</Text>
            <TextInput
              style={styles.input}
              value={targetSessions}
              onChangeText={setTargetSessions}
              placeholder="Enter number"
              keyboardType="numeric"
            />
            <Text style={styles.helperTextSmall}>
              Setting a target will deactivate that schedule for the rest of that day after the
              target is met.
            </Text>
          </View>

          {/* Error Message */}
          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

          {/* Add Button */}
          <TouchableOpacity style={styles.button} onPress={handleAddSchedule}>
            <Text style={styles.buttonText}>Add</Text>
          </TouchableOpacity>

          {/* Saved Schedules */}
          {schedules.length > 0 && (
            <View style={styles.savedSection}>
              <Text style={styles.savedTitle}>Saved</Text>
              {schedules.map((schedule, index) => (
                <View key={index} style={styles.scheduleItem}>
                  <View style={styles.scheduleInfo}>
                    <Text style={styles.scheduleWeekdays}>{schedule.weekdays.join(', ')}</Text>
                    <Text style={styles.scheduleTime}>
                      {schedule.startTime} - {schedule.endTime}
                    </Text>
                    {schedule.targetSessions && (
                      <View style={styles.targetBadge}>
                        <Text style={styles.targetBadgeText}>
                          Target Focus Sessions: {schedule.targetSessions}
                        </Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveSchedule(index)}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
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
    backgroundColor: '#f8f9fa'
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e8eaed'
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f1f1f',
    marginBottom: 16
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#5f6368',
    marginBottom: 16
  },
  helperTextSmall: {
    fontSize: 12,
    lineHeight: 16,
    color: '#5f6368',
    marginTop: 4
  },
  checkboxContainer: {
    marginBottom: 16
  },
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#1f1f1f',
    flex: 1,
    marginRight: 12
  },
  button: {
    backgroundColor: '#1a73e8',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600'
  },
  formGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f1f1f',
    marginBottom: 8
  },
  weekdaysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  weekdayButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff'
  },
  weekdayButtonSelected: {
    backgroundColor: '#1a73e8',
    borderColor: '#1a73e8'
  },
  weekdayButtonText: {
    fontSize: 13,
    color: '#5f6368',
    fontWeight: '500'
  },
  weekdayButtonTextSelected: {
    color: '#ffffff'
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#1f1f1f',
    backgroundColor: '#ffffff'
  },
  timePickerButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    width: 120
  },
  timePickerText: {
    fontSize: 16,
    color: '#1f1f1f',
    fontWeight: '500'
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 8
  },
  savedSection: {
    marginTop: 24
  },
  savedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1f1f',
    marginBottom: 12
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e8eaed'
  },
  scheduleInfo: {
    flex: 1
  },
  scheduleWeekdays: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f1f1f',
    marginBottom: 4
  },
  scheduleTime: {
    fontSize: 14,
    color: '#5f6368',
    marginBottom: 4
  },
  targetBadge: {
    backgroundColor: '#28a745',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4
  },
  targetBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600'
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12
  },
  removeButtonText: {
    color: '#dc3545',
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 22
  }
})
