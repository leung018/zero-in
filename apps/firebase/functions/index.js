/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { setGlobalOptions } = require('firebase-functions')
const { onCall } = require('firebase-functions/https')
const logger = require('firebase-functions/logger')
const { getMessaging } = require('firebase-admin/messaging')
const { initializeApp } = require('firebase-admin')

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10, region: 'asia-east1' })

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

exports.triggerAppBlocking = onCall(async (request, response) => {
  const { fcmToken } = request.data

  if (!fcmToken) {
    logger.error('Missing FCM token')
    throw new Error('FCM token is required')
  }

  // Send push notification that will trigger UNNotificationServiceExtension
  const message = {
    token: fcmToken,
    notification: {
      title: 'Blocking Apps',
      body: 'Focus mode activated'
    },
    data: {
      shouldBlock: 'true'
    },
    apns: {
      payload: {
        aps: {
          contentAvailable: true,
          mutableContent: 1, // Critical for UNNotificationServiceExtension
          sound: 'default'
        }
      }
    }
  }

  try {
    const messageId = await getMessaging().send(message)
    logger.info('Successfully sent blocking notification', {
      messageId
    })
    return { success: true, messageId }
  } catch (error) {
    logger.error('Failed to send blocking notification', {
      error: error.message
    })
    throw new Error('Failed to send notification: ' + error.message)
  }
})
