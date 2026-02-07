import { Ionicons } from '@expo/vector-icons'
import { getAuth, signOut } from '@react-native-firebase/auth'
import { useRouter } from 'expo-router'
import React, { useEffect, useRef } from 'react'
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

type SideMenuProps = {
  visible: boolean
  onClose: () => void
}

export function SideMenu({ visible, onClose }: SideMenuProps) {
  const router = useRouter()
  const slide = useRef(new Animated.Value(0)).current

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

          {/* Future items can be added here and navigate with expo-router */}
        </Animated.View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
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
  }
})

export default SideMenu
