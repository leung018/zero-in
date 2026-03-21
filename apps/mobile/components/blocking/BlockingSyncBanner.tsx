import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export function BlockingSyncBanner({
  triggerAppBlockToggling
}: {
  triggerAppBlockToggling: () => Promise<void>
}) {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'synced'>('idle')

  useEffect(() => {
    if (status !== 'synced') {
      return
    }

    const timeoutId = setTimeout(() => {
      setStatus('idle')
    }, 2500)

    return () => clearTimeout(timeoutId)
  }, [status])

  const handlePress = async () => {
    if (status === 'syncing') {
      return
    }

    try {
      setStatus('syncing')
      await triggerAppBlockToggling()
      setStatus('synced')
    } catch (error) {
      setStatus('idle')
      console.error('Failed to sync blocking state:', error)
      Alert.alert('Sync Failed', 'Unable to sync your blocking state right now. Please try again.')
    }
  }

  const title =
    status === 'syncing'
      ? 'Syncing blocking state...'
      : status === 'synced'
        ? 'Blocking state is up to date'
        : 'Tap to sync your blocking state'

  const description =
    status === 'synced'
      ? 'Your latest blocking rules have been refreshed.'
      : 'Use this if your blocked apps look out of sync.'

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sync blocking state"
        onPress={handlePress}
        disabled={status === 'syncing'}
        style={({ pressed }) => [
          styles.banner,
          pressed && status !== 'syncing' ? styles.bannerPressed : null
        ]}
        testID="blocking-sync-banner"
      >
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        {status === 'syncing' ? (
          <ActivityIndicator color="#1d4ed8" testID="blocking-sync-spinner" />
        ) : (
          <Text style={styles.cta}>{status === 'synced' ? 'Done' : 'Sync'}</Text>
        )}
      </Pressable>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#dbeafe'
  },
  banner: {
    backgroundColor: '#dbeafe',
    borderBottomWidth: 1,
    borderBottomColor: '#bfdbfe',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  bannerPressed: {
    backgroundColor: '#bfdbfe'
  },
  textContainer: {
    flex: 1,
    gap: 2
  },
  title: {
    color: '#1e3a8a',
    fontSize: 14,
    fontWeight: '700'
  },
  description: {
    color: '#1d4ed8',
    fontSize: 12,
    lineHeight: 16
  },
  cta: {
    color: '#1d4ed8',
    fontSize: 13,
    fontWeight: '700'
  }
})
