import { triggerAppBlockToggling } from '@/infra/app-block/toggling-runner'
import { AppPickerView } from '@/modules/app-blocker'
import { Stack, useRouter } from 'expo-router'
import React, { useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function SelectAppsScreen() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Select Blocked Apps',
          headerShown: true
        }}
      />
      <View style={styles.content}>
        {/* TODO: May need fix the UI about the view and loading screen being shown at the same time on android */}
        <View style={styles.appPickerContainer}>
          <AppPickerView
            style={styles.appPicker}
            onAppsLoaded={() => {
              setIsLoading(false)
            }}
          />
        </View>
        {/* TODO: May make app blocking toggling is triggered whenever user change the selected apps */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>Apply immediately</Text>
          <Text style={styles.noticeText}>
            Tap Done to apply your app blocking changes right now. If you leave without tapping
            Done, changes may still sync later but might not take effect immediately.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={async () => {
            await triggerAppBlockToggling()
            router.back()
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Done - Apply Now</Text>
        </TouchableOpacity>
        {isLoading && (
          <View
            style={[
              styles.loadingContainer,
              StyleSheet.absoluteFill,
              { backgroundColor: '#f3f4f6', zIndex: 10 }
            ]}
          >
            <ActivityIndicator size="large" color="#1a73e8" />
            <Text style={styles.loadingText}>Loading apps...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6'
  },
  content: {
    flex: 1,
    padding: 16
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600'
  },
  appPickerContainer: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff'
  },
  appPicker: {
    flex: 1
  },
  noticeBox: {
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10
  },
  noticeTitle: {
    color: '#1d4ed8',
    fontSize: 14,
    fontWeight: '700'
  },
  noticeText: {
    marginTop: 4,
    color: '#1e3a8a',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500'
  },
  primaryButton: {
    backgroundColor: '#1a73e8',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5
  }
})
