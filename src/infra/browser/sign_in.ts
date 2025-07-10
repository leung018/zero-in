import { PublicPath } from 'wxt/browser'

const OFFSCREEN_DOCUMENT_PATH = '/offscreen-sign-in.html'

let creating: Promise<void> | null = null // A global promise to avoid concurrency issues
async function setupOffscreenDocument(path: PublicPath) {
  // Check all windows controlled by the service worker to see if one
  // of them is the offscreen document with the given path
  const offscreenUrl = browser.runtime.getURL(path)
  const existingContexts = await browser.runtime.getContexts({
    contextTypes: [browser.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [offscreenUrl]
  })

  if (existingContexts.length > 0) {
    return
  }

  // create offscreen document
  if (creating) {
    await creating
  } else {
    creating = browser.offscreen.createDocument({
      url: path,
      reasons: [browser.offscreen.Reason.DOM_SCRAPING],
      justification: 'authentication'
    })
    await creating
    creating = null
  }
}

async function getAuth() {
  const auth = await browser.runtime.sendMessage({
    type: 'firebase-auth',
    target: 'offscreen'
  })
  if (auth?.name !== 'FirebaseError') {
    return auth
  } else {
    throw new Error(auth)
  }
}

export async function firebaseAuth() {
  await setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH)

  const auth = await getAuth()
    .then((auth) => {
      console.log('User Authenticated', auth)
      return auth
    })
    .catch((err) => {
      if (err.code === 'auth/operation-not-allowed') {
        console.error(
          'You must enable an OAuth provider in the Firebase' +
            ' console in order to use signInWithPopup. This sample' +
            ' uses Google by default.'
        )
      } else {
        console.error(err)
        return err
      }
    })
    .finally(() => {
      return browser.offscreen.closeDocument()
    })

  return auth
}
