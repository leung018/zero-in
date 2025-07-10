// This URL must point to the public site
const _URL = 'https://zero-in-8211f.web.app'
const iframe = document.createElement('iframe')
iframe.src = _URL
document.documentElement.appendChild(iframe)

const handleChromeMessages: Parameters<typeof browser.runtime.onMessage.addListener>[0] = (
  message,
  sender,
  sendResponse
) => {
  // Extensions may have an number of other reasons to send messages, so you
  // should filter out any that are not meant for the offscreen document.
  if (message.target !== 'offscreen') {
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
  iframe.contentWindow?.postMessage({ initAuth: true }, new URL(_URL).origin)
  return true
}

browser.runtime.onMessage.addListener(handleChromeMessages)
