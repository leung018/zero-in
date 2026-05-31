import Constants from 'expo-constants'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { FirebaseServices } from '../firebase/services'

function getProjectId(): string {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId
  if (!projectId) throw new Error('EAS projectId not configured')
  return projectId
}

async function getCurrentExpoPushToken(): Promise<string> {
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId: getProjectId() })
  return data
}

export async function registerPushToken(uid: string): Promise<void> {
  const token = await getCurrentExpoPushToken()
  const storage = await FirebaseServices.getFirestoreTokenStorage(uid)
  await storage.register({ token, platform: Platform.OS })
}

export async function unregisterPushToken(uid: string): Promise<void> {
  try {
    const token = await getCurrentExpoPushToken()
    const storage = await FirebaseServices.getFirestoreTokenStorage(uid)
    await storage.unregister(token)
  } catch {
    // best-effort
  }
}
