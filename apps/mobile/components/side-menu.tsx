import { Ionicons } from '@expo/vector-icons'
import { getAuth, signOut } from '@react-native-firebase/auth'
import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Animated,
  BackHandler,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { newAccountDeletionService } from '../factories'
import { PasswordPromptModal } from './password-prompt-modal'

type SideMenuProps = {
  visible: boolean
  onClose: () => void
}

export function SideMenu({ visible, onClose }: SideMenuProps) {
  const router = useRouter()
  const slide = useMemo(() => new Animated.Value(0), [])
  const [resolvePassword, setResolvePassword] = useState<
    ((password: string | null) => void) | null
  >(null)

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start()
  }, [visible, slide])

  useEffect(() => {
    if (!visible) return

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose()
      return true
    })

    return () => backHandler.remove()
  }, [visible, onClose])

  const translateX = slide.interpolate({ inputRange: [0, 1], outputRange: [240, 0] })
  const backdropOpacity = slide.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] })

  const rawHash = Constants.expoConfig?.extra?.commitHash
  const buildInfo = typeof rawHash === 'string' ? rawHash.slice(0, 7) : 'Local Development'

  if (!visible) return null

  const handleSignOut = async () => {
    try {
      await signOut(getAuth())
      onClose()
    } catch (error) {
      console.error('Error signing out:', error)
      Alert.alert('Sign-Out Error', 'An error occurred during sign-out. Please try again.')
    }
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account?',
      "This permanently deletes your account and all its data, including data synced with the browser extension. This can't be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteAccount }
      ]
    )
  }

  const promptPassword = () =>
    new Promise<string | null>((resolve) => setResolvePassword(() => resolve))

  const answerPasswordPrompt = (password: string | null) => {
    resolvePassword?.(password)
    setResolvePassword(null)
  }

  const deleteAccount = async () => {
    try {
      const service = await newAccountDeletionService({ promptPassword })
      if ((await service.deleteAccount()) === 'deleted') {
        onClose()
        Alert.alert('Account Deleted', 'Your account and data have been deleted.')
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      Alert.alert(
        'Delete Account Error',
        'An error occurred while deleting your account. Please try again.'
      )
    }
  }

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <SafeAreaView edges={['top']} style={styles.panelContainer}>
        <Animated.View style={[styles.panel, { transform: [{ translateX }] }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Menu</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color="#1f1f1f" />
            </Pressable>
          </View>

          <View style={styles.divider} />

          {__DEV__ && (
            <Pressable
              style={styles.item}
              onPress={() => {
                router.push('/dev-test' as any)
                onClose()
              }}
            >
              <Ionicons name="flask-outline" size={20} color="#1a73e8" />
              <Text style={styles.itemText}>Dev Test</Text>
            </Pressable>
          )}

          {/* Actions */}
          <Pressable style={styles.item} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color="#dc3545" />
            <Text style={styles.itemDanger}>Sign Out</Text>
          </Pressable>

          <Pressable style={styles.item} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={20} color="#dc3545" />
            <Text style={styles.itemDanger}>Delete Account</Text>
          </Pressable>

          {/* Future items can be added here and navigate with expo-router */}

          {buildInfo && <Text style={styles.buildInfo}>Build: {buildInfo}</Text>}
        </Animated.View>
      </SafeAreaView>

      {resolvePassword && (
        <PasswordPromptModal
          onSubmit={answerPasswordPrompt}
          onCancel={() => answerPasswordPrompt(null)}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000'
  },
  panelContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 240
  },
  panel: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    borderLeftWidth: 1,
    borderLeftColor: '#e8eaed'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1f1f'
  },
  divider: {
    height: 1,
    backgroundColor: '#e8eaed',
    marginVertical: 12
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12
  },
  itemText: {
    color: '#1a73e8',
    fontWeight: '600',
    fontSize: 16
  },
  itemDanger: {
    color: '#dc3545',
    fontWeight: '600',
    fontSize: 16
  },
  buildInfo: {
    marginTop: 'auto',
    color: '#9aa0a6',
    fontSize: 12
  }
})

export default SideMenu
