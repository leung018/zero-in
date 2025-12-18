import { commonStyles } from '@/constants/styles'
import React, { useState } from 'react'
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'

export function TimerBasedSetting() {
  const [pauseDuringBreaks, setPauseDuringBreaks] = useState(false)
  const [pauseWhenNotRunning, setPauseWhenNotRunning] = useState(false)

  const handleSaveTimerBased = () => {
    Alert.alert('Success', 'Timer-based settings saved!')
  }

  return (
    <View style={commonStyles.card}>
      <View style={commonStyles.sectionHeader}>
        <Text style={commonStyles.cardTitle}>⏱️ Timer-Based</Text>
        <View style={commonStyles.divider} />
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
            <Text style={styles.settingDescription}>Stop blocking when timer is not running</Text>
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
  )
}

const styles = StyleSheet.create({
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
  }
})
