import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Welcome Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎉 Welcome!</Text>
          <Text style={styles.cardText}>
            You&apos;re successfully logged in and can access all premium features.
          </Text>
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
    padding: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1f1f1f'
  },
  logoutButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8eaed'
  },
  logoutText: {
    color: '#dc3545',
    fontWeight: '600',
    fontSize: 14
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
    fontSize: 24,
    fontWeight: '700',
    color: '#1f1f1f',
    marginBottom: 12
  },
  cardText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5f6368'
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 12
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f1f1f',
    marginBottom: 8
  },
  featureText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5f6368'
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  statItem: {
    alignItems: 'center',
    flex: 1
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a73e8',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: '#5f6368',
    textAlign: 'center'
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e8eaed',
    marginHorizontal: 8
  }
})
