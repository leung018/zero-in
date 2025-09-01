import config from '../../config'

const iframe = document.createElement('iframe')
iframe.src = config.getAuthUrl()
document.documentElement.appendChild(iframe)

const handleBrowserMessages: Parameters<typeof browser.runtime.onMessage.addListener>[0] = (
  message,
  _,
  sendResponse
) => {
  if (message.target !== 'offscreen' && message.type !== 'FIREBASE_AUTH') {
    return false
  }

  function handleIframeMessage({ data }: MessageEvent) {
    try {
      if (data.startsWith('!_{')) {
        // Other parts of the Firebase library send messages using postMessage.
        // You don't care about them in this context, so return early.
        return
      }
      data = JSON.parse(data)
      self.removeEventListener('message', handleIframeMessage)

      sendResponse(data)
    } catch (e) {
      console.error(`json parse failed - ${e}`)
    }
  }

  globalThis.addEventListener('message', handleIframeMessage, false)

  // Initialize the authentication flow in the iframed document. You must set the
  // second argument (targetOrigin) of the message in order for it to be successfully
  // delivered.
  iframe.contentWindow?.postMessage({ initAuth: true }, new URL(config.getAuthUrl()).origin)
  return true
}

browser.runtime.onMessage.addListener(handleBrowserMessages)
