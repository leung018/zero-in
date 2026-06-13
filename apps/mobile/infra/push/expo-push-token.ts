import { MobileSyncNotifier } from '@zero-in/shared/infra/push/mobile-sync-notifier'
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

function createNotifier(uid: string): MobileSyncNotifier {
  return new MobileSyncNotifier({
    getTokenStorage: () => FirebaseServices.getFirestoreTokenStorage(uid)
  })
}

// See the TODO comment in app/_layout.tsx about testing strategy for this module

export async function registerPushToken(uid: string): Promise<void> {
  const token = await getCurrentExpoPushToken()
  await createNotifier(uid).register(token, Platform.OS)
}

export async function unregisterPushToken(uid: string): Promise<void> {
  try {
    const token = await getCurrentExpoPushToken()
    await createNotifier(uid).unregister(token)
  } catch {
    // best-effort
  }
}
