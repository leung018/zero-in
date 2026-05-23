import firestore, { serverTimestamp } from '@react-native-firebase/firestore'
import Constants from 'expo-constants'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

function getProjectId(): string {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId
  if (!projectId) throw new Error('EAS projectId not configured')
  return projectId
}

export async function registerPushToken(uid: string): Promise<void> {
  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId: getProjectId()
  })
  await firestore()
    .collection('users')
    .doc(uid)
    .collection('pushTokens')
    .doc(token)
    .set({ token, platform: Platform.OS, updatedAt: serverTimestamp() })
}

export async function unregisterPushToken(uid: string): Promise<void> {
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: getProjectId()
    })
    await firestore().collection('users').doc(uid).collection('pushTokens').doc(token).delete()
  } catch {
    // best-effort
  }
}
