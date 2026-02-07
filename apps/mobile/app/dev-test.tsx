import { commonStyles } from '@/constants/styles'
import { ScheduleSpan } from '@/domain/schedules/schedule-span'
import { APP_BLOCK_TOGGLING_TASK } from '@/infra/app-block/toggling-runner'
import { appBlocker } from '@/modules/app-blocker'
import DateTimePicker from '@react-native-community/datetimepicker'
import * as BackgroundTask from 'expo-background-task'
import { Stack } from 'expo-router'
import React, { useState } from 'react'
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

function DevTestContent() {
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 60 * 60 * 1000)) // 1 hour from now
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)

  const formatDateTime = (date: Date): string => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const handleBlockApps = async () => {
    try {
      await appBlocker.blockApps()
      Alert.alert('Success', 'Apps blocked successfully')
    } catch (error) {
      console.error('Failed to block apps:', error)
      Alert.alert('Error', `Failed to block apps: ${error}`)
    }
  }

  const handleUnblockApps = async () => {
    try {
      await appBlocker.unblockApps()
      Alert.alert('Success', 'Apps unblocked successfully')
    } catch (error) {
      console.error('Failed to unblock apps:', error)
      Alert.alert('Error', `Failed to unblock apps: ${error}`)
    }
  }

  const handleClearSchedule = async () => {
    try {
      await appBlocker.clearSchedule()
      Alert.alert('Success', 'Schedule cleared successfully')
    } catch (error) {
      console.error('Failed to clear schedule:', error)
      Alert.alert('Error', `Failed to clear schedule: ${error}`)
    }
  }

  const handleSetSchedule = async () => {
    // Validate start < end
    if (startDate >= endDate) {
      Alert.alert('Invalid Schedule', 'Start time must be before end time')
      return
    }

    try {
      const scheduleSpan: ScheduleSpan = {
        start: startDate,
        end: endDate
      }
      await appBlocker.setSchedule(scheduleSpan)
      Alert.alert(
        'Success',
        `Schedule set:\nStart: ${formatDateTime(startDate)}\nEnd: ${formatDateTime(endDate)}`
      )
    } catch (error) {
      console.error('Failed to set schedule:', error)
      Alert.alert('Error', `Failed to set schedule: ${error}`)
    }
  }

  const handleTriggerBackgroundTask = async () => {
    try {
      await BackgroundTask.triggerTaskWorkerForTestingAsync()
      Alert.alert('Success', `Background task (${APP_BLOCK_TOGGLING_TASK}) triggered successfully`)
    } catch (error) {
      console.error('Failed to trigger background task:', error)
      Alert.alert('Error', `Failed to trigger background task: ${error}`)
    }
  }

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios')
    if (selectedDate) {
      setStartDate(selectedDate)
    }
  }

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios')
    if (selectedDate) {
      setEndDate(selectedDate)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Dev Testing',
          headerShown: true
        }}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Schedule Configuration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule Configuration</Text>

          <View style={styles.dateTimeSection}>
            <Text style={styles.label}>Start Time</Text>
            <Pressable style={styles.dateTimeButton} onPress={() => setShowStartPicker(true)}>
              <Text style={styles.dateTimeText}>{formatDateTime(startDate)}</Text>
            </Pressable>
            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="datetime"
                display="default"
                onChange={onStartDateChange}
              />
            )}
          </View>

          <View style={styles.dateTimeSection}>
            <Text style={styles.label}>End Time</Text>
            <Pressable style={styles.dateTimeButton} onPress={() => setShowEndPicker(true)}>
              <Text style={styles.dateTimeText}>{formatDateTime(endDate)}</Text>
            </Pressable>
            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="datetime"
                display="default"
                onChange={onEndDateChange}
              />
            )}
          </View>

          <TouchableOpacity style={commonStyles.secondaryButton} onPress={handleSetSchedule}>
            <Text style={commonStyles.secondaryButtonText}>Set Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity style={commonStyles.secondaryButton} onPress={handleClearSchedule}>
            <Text style={commonStyles.secondaryButtonText}>Clear Schedule</Text>
          </TouchableOpacity>
        </View>

        {/* App Blocking Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Blocking Actions</Text>

          <TouchableOpacity style={commonStyles.secondaryButton} onPress={handleBlockApps}>
            <Text style={commonStyles.secondaryButtonText}>Block Apps</Text>
          </TouchableOpacity>

          <TouchableOpacity style={commonStyles.secondaryButton} onPress={handleUnblockApps}>
            <Text style={commonStyles.secondaryButtonText}>Unblock Apps</Text>
          </TouchableOpacity>
        </View>

        {/* Background Task Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Background Task</Text>

          <TouchableOpacity
            style={commonStyles.secondaryButton}
            onPress={handleTriggerBackgroundTask}
          >
            <Text style={commonStyles.secondaryButtonText}>Trigger Background Task</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default function DevTestScreen() {
  // Hide this page completely in production builds
  if (!__DEV__) {
    return null
  }

  return <DevTestContent />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  scrollView: {
    flex: 1
  },
  content: {
    padding: 16,
    paddingBottom: 32
  },
  section: {
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
    elevation: 3
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f1f1f',
    marginBottom: 16
  },
  dateTimeSection: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8
  },
  dateTimeButton: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8eaed'
  },
  dateTimeText: {
    fontSize: 16,
    color: '#1f1f1f',
    fontWeight: '500'
  }
})
