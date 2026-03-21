import { commonStyles } from '@/constants/styles'
import { getAuth, signOut } from '@react-native-firebase/auth'
import React from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const handleSignOut = async () => {
  try {
    await signOut(getAuth())
  } catch (error) {
    console.error('Error signing out:', error)
    Alert.alert('Sign-Out Error', 'An error occurred during sign-out. Please try again.')
  }
}

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Welcome Card */}
        <View style={commonStyles.card}>
          <Text style={commonStyles.cardTitle}>🎉 Welcome!</Text>
          <Text style={styles.cardText}>
            You&apos;re successfully logged in and can access all premium features.
          </Text>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
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
    padding: 20
  },
  signOutButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8eaed'
  },
  signOutText: {
    color: '#dc3545',
    fontWeight: '600',
    fontSize: 14
  },
  cardText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5f6368'
  }
})
