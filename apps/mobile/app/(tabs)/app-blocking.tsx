import { useCallback } from 'react'
import { FlatList, RefreshControl, Switch, View } from 'react-native'
import { ThemedText } from '../../components/themed-text'
import { ThemedView } from '../../components/themed-view'
import { useAppBlocking } from '../contexts/app-blocking-context'

export default function AppBlockingScreen() {
  const {
    installedApps,
    allowedApps,
    isLoading,
    hasPermission,
    requestPermission,
    setAllowedApps,
    refreshApps
  } = useAppBlocking()

  const toggleApp = useCallback(
    (packageName: string) => {
      const newAllowedApps = allowedApps.includes(packageName)
        ? allowedApps.filter((pkg) => pkg !== packageName)
        : [...allowedApps, packageName]

      setAllowedApps(newAllowedApps)
    },
    [allowedApps, setAllowedApps]
  )

  if (!hasPermission) {
    return (
      <ThemedView style={{ flex: 1, padding: 16, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText style={{ fontSize: 16, marginBottom: 20, textAlign: 'center' }}>
          Usage stats permission is required to monitor and block apps.
        </ThemedText>
        <ThemedText
          onPress={requestPermission}
          style={{
            padding: 12,
            backgroundColor: '#007AFF',
            color: 'white',
            borderRadius: 8,
            overflow: 'hidden'
          }}
        >
          Grant Permission
        </ThemedText>
      </ThemedView>
    )
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <FlatList
        data={installedApps}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshApps} />}
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#ccc'
            }}
          >
            <View style={{ flex: 1 }}>
              <ThemedText style={{ fontSize: 16 }}>{item.label}</ThemedText>
              <ThemedText style={{ fontSize: 12, color: '#666' }}>{item.packageName}</ThemedText>
            </View>
            <Switch
              value={allowedApps.includes(item.packageName)}
              onValueChange={() => toggleApp(item.packageName)}
            />
          </View>
        )}
        keyExtractor={(item) => item.packageName}
      />
    </ThemedView>
  )
}
