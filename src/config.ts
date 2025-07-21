import type { BlockingTimerIntegration } from './domain/blocking_timer_integration'
import type { NotificationSetting } from './domain/notification_setting'
import { TimerConfig } from './domain/timer/config'
import { Duration } from './domain/timer/duration'
import type { BadgeColor } from './infra/badge'

const getBlockedTemplateUrl = () => {
  return browser.runtime.getURL('/blocked.html')
}

const getReminderPageUrl = () => {
  return browser.runtime.getURL('/reminder.html')
}

const getDefaultTimerConfig = () => {
  return new TimerConfig({
    focusDuration: new Duration({ minutes: 26 }),
    shortBreakDuration: new Duration({ minutes: 5 }),
    longBreakDuration: new Duration({ minutes: 19 }),
    focusSessionsPerCycle: 4
  })
}

const getDefaultNotificationSetting = () => {
  const notificationSetting: NotificationSetting = {
    reminderTab: true,
    desktopNotification: true,
    sound: true
  }
  return notificationSetting
}

const getDefaultBlockingTimerIntegration = (): BlockingTimerIntegration => {
  return {
    pauseBlockingDuringBreaks: true,
    pauseBlockingWhenTimerNotRunning: false
  }
}

const getFocusSessionRecordHouseKeepDays = () => 30

const getBadgeColorConfig = (): {
  focusBadgeColor: BadgeColor
  breakBadgeColor: BadgeColor
} => {
  return {
    focusBadgeColor: {
      textColor: '#ffffff',
      backgroundColor: '#ff0000'
    },
    breakBadgeColor: {
      textColor: '#ffffff',
      backgroundColor: '#6495ed'
    }
  }
}

const getSignInUrl = () => {
  return 'https://' + getFirebaseConfig().authDomain
}

const getFirebaseConfig = () => ({
  // "API keys for Firebase services are OK to include in code or checked-in config files."
  // https://firebase.google.com/docs/projects/api-keys
  // Only key for firebase admin SDK should not be checked in but below is key for web app only
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCKpyNci-eL6CgHmw0MUqjn8DtVJlaYqDI',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'zero-in-8211f.web.app',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'zero-in-8211f',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'zero-in-8211f.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '54527256719',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:54527256719:web:a04aee2a067e57f4d628fa',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-ZX6X3XNJTP'
})

export default {
  getDefaultTimerConfig,
  getFocusSessionRecordHouseKeepDays,
  getBlockedTemplateUrl,
  getBadgeColorConfig,
  getReminderPageUrl,
  getDefaultNotificationSetting,
  getDefaultBlockingTimerIntegration,
  getSignInUrl,
  getFirebaseConfig
}
