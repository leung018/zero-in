# Plan: Make notifications visible and require user tap to trigger service

## Current Issue

The current implementation uses `addNotificationReceivedListener` which only fires when:

- The app is in the foreground, OR
- The user manually taps the notification

It does NOT automatically wake the app from background.

## Solution

Make the notification **visible** with a clear call-to-action, prompting users to tap it. This tap triggers the service run.

## Changes Needed

### 1. Update notification content in [notification-scheduler.ts](apps/mobile/infra/notification-scheduler.ts#L21-L29)

Change from silent to visible notification:

```typescript
// Schedule visible notification at the specified time
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Focus Session Ending',
    body: 'Tap to update your app blocking schedule',
    data: {
      identifier: APP_BLOCK_SCHEDULE_END_NOTIFICATION_ID,
      triggerSource: 'schedule-end'
    }
  },
```

### 2. Change listener to handle taps in [\_layout.tsx](apps/mobile/app/_layout.tsx#L29-L37)

Replace `addNotificationReceivedListener` with `addNotificationResponseReceivedListener`:

```typescript
// Listen for notification taps that trigger app blocking service
const notificationResponseListener = Notifications.addNotificationResponseReceivedListener(
  async (response) => {
    const triggerSource = response.notification.request.content.data?.triggerSource
    if (triggerSource === 'schedule-end') {
      console.log('[RootLayout] Notification tapped, triggering sync')
      await triggerAppBlockTogglingSync()
    }
  }
)
```

### 3. Update cleanup in [\_layout.tsx](apps/mobile/app/_layout.tsx#L44-L47)

```typescript
return () => {
  unsubscribe()
  notificationResponseListener.remove()
}
```

## Behavior Flow

1. Service runs at scheduleEnd → schedules notification
2. Notification appears with title/body prompting user action
3. User taps notification → `addNotificationResponseReceivedListener` fires
4. Service runs again → finds new schedule → schedules next notification
5. Periodic 15-min task acts as fallback if user doesn't tap

## Benefits

- Clear user intent required (tap = acknowledge schedule change)
- No reliance on unreliable background wakeup mechanisms
- User stays informed about schedule transitions
- 15-min periodic task ensures system stays in sync even without taps
