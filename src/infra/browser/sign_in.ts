const OFFSCREEN_DOCUMENT_PATH = '/offscreen-sign-in.html'

// Require Manual testing
export async function firebaseAuth(onAuthSuccess: (auth: any) => void): Promise<any> {
  const offscreenContexts = await browser.runtime.getContexts({
    contextTypes: [browser.runtime.ContextType.OFFSCREEN_DOCUMENT]
  })

  if (offscreenContexts.length === 0) {
    await setupOffscreenDocument()
  } else if (offscreenContexts[0].documentUrl !== browser.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)) {
    await browser.offscreen.closeDocument()
    await setupOffscreenDocument()
  }

  await getAuth()
    .then((result) => {
      onAuthSuccess(result)
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
      }
    })
    .finally(browser.offscreen.closeDocument)
}

let creating: Promise<void> | null = null // A global promise to avoid concurrency issues
async function setupOffscreenDocument() {
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

async function getAuth() {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    const auth = await browser.runtime.sendMessage({
      type: 'FIREBASE_AUTH',
      target: 'offscreen'
    })
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    auth?.name !== 'FirebaseError' ? resolve(auth) : reject(auth)
  })
}
