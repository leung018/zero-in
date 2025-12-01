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
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a73e8" />
            <Text style={styles.loadingText}>Loading apps...</Text>
          </View>
        )}
        <View style={[styles.appPickerContainer, isLoading && styles.hidden]}>
          <AppPickerView
            style={styles.appPicker}
            onAppsLoaded={() => {
              setIsLoading(false)
            }}
          />
        </View>
        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.hidden]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Done</Text>
        </TouchableOpacity>
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
  hidden: {
    display: 'none'
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
