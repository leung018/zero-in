import {
  AppBlockerPermissions,
  PermissionStatus,
  PermissionType
} from '@/modules/app-blocker/src/permission'
import { useCallback, useEffect, useState } from 'react'
import { Alert, AppState, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { createLogger } from '../../utils/logger'

const log = createLogger('PermissionBanners')

const getPermissionLabel = (permissionType: PermissionType): string => {
  const labels: Record<PermissionType, string> = {
    [PermissionType.FamilyControls]: 'Family Controls',
    [PermissionType.Overlay]: 'Appear on Top',
    [PermissionType.UsageStats]: 'Usage Access',
    [PermissionType.ExactAlarm]: 'Exact Alarms',
    [PermissionType.IgnoreBatteryOptimizations]: 'Unrestricted Battery Usage'
  }
  return labels[permissionType] || permissionType
}

const getPermissionDescription = (permissionType: PermissionType): string => {
  const descriptions: Record<PermissionType, string> = {
    [PermissionType.FamilyControls]: 'Allow Zero In to block apps using iOS Family Controls.',
    [PermissionType.Overlay]: 'Allow Zero In to appear on top of other apps for blocking.',
    [PermissionType.UsageStats]: 'Allow Zero In to detect which apps are active for blocking.',
    [PermissionType.ExactAlarm]:
      'Allow Zero In to trigger scheduled blocking at the exact configured time.',
    [PermissionType.IgnoreBatteryOptimizations]:
      'Recommended: lets Zero In run more reliably in the background.'
  }
  return descriptions[permissionType] || 'This permission is required for app blocking.'
}

const isRecommendedPermission = (permissionType: PermissionType): boolean =>
  permissionType === PermissionType.IgnoreBatteryOptimizations

export function PermissionBanners({
  appBlockerPermissions
}: {
  appBlockerPermissions: AppBlockerPermissions
}) {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>(
    PermissionStatus.empty()
  )

  const refreshPermissionStatus = useCallback(() => {
    return appBlockerPermissions
      .getPermissionStatus()
      .then(setPermissionStatus)
      .catch((error) => {
        log.error('Failed to refresh permission status:', error)
      })
  }, [appBlockerPermissions])

  useEffect(() => {
    refreshPermissionStatus()

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        refreshPermissionStatus()
      }
    })

    return () => {
      subscription.remove()
    }
  }, [refreshPermissionStatus])

  const requestPermission = async (permissionType: PermissionType) => {
    try {
      await appBlockerPermissions.requestPermission(permissionType)
    } catch (error) {
      log.error(`Failed to request ${permissionType} permission:`, error)
    }
  }

  const handleRequestPermission = async (permissionType: PermissionType) => {
    if (permissionType === PermissionType.IgnoreBatteryOptimizations) {
      Alert.alert(
        'Unrestricted Battery Usage',
        "On the next screen:\n\n  1. Tap 'App battery usage'\n  2. Choose 'Unrestricted'\n\nLabels may differ on your device (e.g. Samsung, Sony). Look for a battery option that removes background restrictions.",
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => requestPermission(permissionType) }
        ]
      )
      return
    }
    await requestPermission(permissionType)
  }

  return (
    <View testID="permission-banners">
      {permissionStatus.getMissingPermissions().map((permissionType) => {
        const recommended = isRecommendedPermission(permissionType)
        return (
          <TouchableOpacity
            key={permissionType}
            testID={`permission-banner-${permissionType}`}
            style={recommended ? styles.recommendedBanner : styles.permissionBanner}
            onPress={() => handleRequestPermission(permissionType)}
            activeOpacity={0.8}
          >
            <Text style={styles.permissionIcon}>{recommended ? '💡' : '⚠️'}</Text>
            <View style={styles.permissionTextContainer}>
              <Text style={recommended ? styles.recommendedTitle : styles.permissionTitle}>
                {getPermissionLabel(permissionType)} {recommended ? 'Recommended' : 'Required'}
              </Text>
              <Text style={recommended ? styles.recommendedDesc : styles.permissionDesc}>
                {getPermissionDescription(permissionType)}
              </Text>
            </View>
            <Text style={recommended ? styles.recommendedArrow : styles.arrowIcon}>→</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  permissionBanner: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#fee2e2',
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3
  },
  permissionTextContainer: {
    flex: 1,
    paddingHorizontal: 12
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991b1b',
    marginBottom: 2
  },
  permissionDesc: {
    fontSize: 13,
    color: '#b91c1c',
    lineHeight: 18
  },
  permissionIcon: {
    fontSize: 24
  },
  arrowIcon: {
    fontSize: 20,
    color: '#991b1b',
    fontWeight: '700'
  },
  recommendedBanner: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#fef3c7',
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3
  },
  recommendedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 2
  },
  recommendedDesc: {
    fontSize: 13,
    color: '#b45309',
    lineHeight: 18
  },
  recommendedArrow: {
    fontSize: 20,
    color: '#92400e',
    fontWeight: '700'
  }
})
