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
  // await browser.offscreen.closeDocument()
  await browser.offscreen.createDocument({
    url: 'offscreen-sign-in.html',
    reasons: [browser.offscreen.Reason.DOM_SCRAPING],
    justification: 'authentication'
  })

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
