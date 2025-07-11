const OFFSCREEN_DOCUMENT_PATH = '/offscreen-sign-in.html'

let creating: Promise<void> | null = null // A global promise to avoid concurrency issues

// Chrome only allows for a single offscreenDocument. This is a helper function
// that returns a boolean indicating if a document is already active.
async function hasDocument() {
  const offscreenUrl = browser.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)
  const existingContexts = await browser.runtime.getContexts({
    contextTypes: [browser.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [offscreenUrl]
  })
  return existingContexts.length > 0
}

async function setupOffscreenDocument() {
  if (await hasDocument()) {
    console.log('Offscreen document already exists, skipping creation.')
    return
  }

  if (creating) {
    await creating
  } else {
    creating = browser.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: [browser.offscreen.Reason.DOM_SCRAPING],
      justification: 'authentication'
    })
    await creating
    creating = null
  }
}

async function closeOffscreenDocument() {
  if (!(await hasDocument())) {
    return
  }
  await browser.offscreen.closeDocument()
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
  await setupOffscreenDocument()

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
    .finally(closeOffscreenDocument)

  return auth
}
