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
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    'TODO: I think is safe to expose client web api key here',
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
