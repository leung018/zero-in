import { AppPickerView } from '@/modules/app-blocker'
import { Stack, useRouter } from 'expo-router'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function SelectAppsScreen() {
  const router = useRouter()
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Select Blocked Apps',
          headerShown: true
        }}
      />
      <View style={styles.content}>
        <View style={styles.appPickerContainer}>
          <AppPickerView style={styles.appPicker} />
        </View>
        <TouchableOpacity
          style={styles.primaryButton}
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
