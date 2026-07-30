// Expo's push relay JSON-encodes our custom `data` payload into a `dataString` field rather than
// spreading it directly, and nests it differently per platform:
// - Android: notification.request.content.dataString
// - iOS: data.dataString

// TODO: Haven't test ios Part. Can also consider removing unit tests of that because may not be so useful.
// Update below comment after ios part is tested.
export function extractNotificationTaskPayload(data: any): any {
  // Android: data.data.dataString
  const dataString = data?.notification?.request?.content?.dataString ?? data?.data?.dataString

  if (!dataString) return undefined
  try {
    return JSON.parse(dataString)
  } catch {
    return undefined
  }
}
