<script setup lang="ts">
import config from '@/config'
import type { StorageInterface } from '@zero-in/shared/infra/storage/interface'
import { ImportRecordStorageService } from '../../domain/import/record/storage'
import type { SignInProvider } from '../../infra/browser/sign-in'
import { FirebaseServices } from '../../infra/firebase/services'
import { newLocalStorage } from '../../infra/storage/local-storage'
import SignInProcessHelper from '../../pages/SignInProcessHelper.vue'

// Require manual testing

const showProcessHelper = ref(false)
const signInProcessHelperRef = ref<InstanceType<typeof SignInProcessHelper> | null>(null)

const remoteStorage = shallowRef<StorageInterface | null>(null)
const importRecordStorage = shallowRef<ImportRecordStorageService | null>(null)

const LOGIN_POPUP_URL_PATTERNS: Record<SignInProvider, string> = {
  google: '*://accounts.google.com/*',
  apple: '*://appleid.apple.com/*'
}

const pollAndFocusLoginPopup = (provider: SignInProvider) => {
  const intervalId = setInterval(() => {
    browser.tabs.query({ url: LOGIN_POPUP_URL_PATTERNS[provider] }).then((tabs) => {
      const targetTab = tabs.find(
        (tab) => tab.url && tab.url.includes(config.getFirebaseConfig().authDomain)
      )

      if (targetTab) {
        browser.windows.update(targetTab.windowId, { focused: true })
        clearInterval(intervalId)
      }
    })
  }, 500)
}

const signIn = (provider: SignInProvider) => {
  pollAndFocusLoginPopup(provider) // In mac os, the popup might be behind other windows. So add this workaround to bring it to front.
  showProcessHelper.value = true

  sendSignInWithRetry(provider)

  FirebaseServices.onAuthStateChanged(async (auth) => {
    if (auth) {
      const rs = await FirebaseServices.getFirestoreAppStorage()
      remoteStorage.value = rs
      importRecordStorage.value = new ImportRecordStorageService(rs)
      await nextTick()
      signInProcessHelperRef.value!.triggerHelperProcess()
    }
  })
}

const sendSignInWithRetry = async (provider: SignInProvider) => {
  return retryUntilSuccess(
    async () => {
      await browser.runtime.sendMessage({
        type: 'SIGN_IN',
        provider
      })
    },
    {
      retryIntervalMs: 500,
      functionName: 'sendSignInWithRetry'
    }
  )
}

const onHelperProcessComplete = async () => {
  // Cannot setPersistence inside service worker. So have to set it outside service worker.
  //
  // If setPersistence before helper process complete, seem have some problem.
  // But if set it below, the problem seem fixed.
  await FirebaseServices.setPersistence()

  await browser.runtime.sendMessage({
    type: 'RELOAD'
  })
  await browser.runtime.openOptionsPage()
  window.close()
}
</script>

<template>
  <div class="signin-container">
    <h2 class="mb-4">Sign in to Zero In</h2>

    <div class="message-box">
      <p>
        <strong>Sign in</strong> to unlock
        <a href="https://zeroin.dev/premium" target="_blank" rel="noopener"
          ><strong>premium features</strong></a
        >! Enjoy a <strong>free trial</strong> during this <strong>limited-time promotion</strong>,
        though it may end at any time.
      </p>
    </div>

    <p class="mt-3 text-muted" style="font-size: 0.85em">
      By signing in, you agree to the
      <a href="https://zeroin.dev/tos" class="text-decoration-none" target="_blank" rel="noopener"
        >Terms of Service</a
      >
      and
      <a
        href="https://zeroin.dev/privacy"
        class="text-decoration-none"
        target="_blank"
        rel="noopener"
        >Privacy Policy</a
      >.
    </p>

    <div class="sign-in-buttons">
      <button class="gsi-material-button" @click="signIn('google')">
        <div class="gsi-material-button-state"></div>
        <div class="gsi-material-button-content-wrapper">
          <div class="gsi-material-button-icon">
            <svg
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              xmlns:xlink="http://www.w3.org/1999/xlink"
              style="display: block"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              ></path>
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              ></path>
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              ></path>
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              ></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
          </div>
          <span class="gsi-material-button-contents">Sign in with Google</span>
          <span style="display: none">Sign in with Google</span>
        </div>
      </button>

      <button class="apple-sign-in-button" @click="signIn('apple')">
        <svg
          width="24px"
          height="44px"
          viewBox="0 0 24 44"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <!-- Generator: Sketch 61 (89581) - https://sketch.com -->
          <title>Left White Logo Small</title>
          <desc>Created with Sketch.</desc>
          <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
            <rect id="Rectangle" fill="#000000" x="0" y="0" width="24" height="44"></rect>
            <path
              d="M12.2337427,16.9879688 C12.8896607,16.9879688 13.7118677,16.5445313 14.2014966,15.9532812 C14.6449341,15.4174609 14.968274,14.6691602 14.968274,13.9208594 C14.968274,13.8192383 14.9590357,13.7176172 14.9405591,13.6344727 C14.2107349,13.6621875 13.3330982,14.1241016 12.8065162,14.7430664 C12.3907935,15.2142188 12.012024,15.9532812 12.012024,16.7108203 C12.012024,16.8216797 12.0305005,16.9325391 12.0397388,16.9694922 C12.0859302,16.9787305 12.1598365,16.9879688 12.2337427,16.9879688 Z M9.92417241,28.1662891 C10.8202857,28.1662891 11.2175318,27.5658008 12.3353638,27.5658008 C13.4716724,27.5658008 13.721106,28.1478125 14.7188404,28.1478125 C15.6980982,28.1478125 16.3540162,27.2424609 16.972981,26.3555859 C17.6658521,25.339375 17.9522388,24.3416406 17.9707154,24.2954492 C17.9060474,24.2769727 16.0306763,23.5101953 16.0306763,21.3576758 C16.0306763,19.491543 17.5088013,18.6508594 17.5919459,18.5861914 C16.612688,17.1819727 15.1253248,17.1450195 14.7188404,17.1450195 C13.6194849,17.1450195 12.7233716,17.8101758 12.1598365,17.8101758 C11.5501099,17.8101758 10.7463794,17.1819727 9.79483648,17.1819727 C7.98413335,17.1819727 6.14571538,18.6785742 6.14571538,21.5054883 C6.14571538,23.2607617 6.8293482,25.1176563 7.67003179,26.3186328 C8.39061773,27.3348438 9.01882085,28.1662891 9.92417241,28.1662891 Z"
              fill="#FFFFFF"
              fill-rule="nonzero"
            ></path>
          </g>
        </svg>
        <span>Sign in with Apple</span>
      </button>
    </div>
  </div>

  <SignInProcessHelper
    v-if="remoteStorage && importRecordStorage"
    ref="signInProcessHelperRef"
    v-show="showProcessHelper"
    :localStorage="newLocalStorage()"
    :remoteStorage="remoteStorage"
    :importRecordStorageService="importRecordStorage"
    @onHelperProcessComplete="onHelperProcessComplete"
  />
</template>

<style scoped>
.signin-container {
  font-family: 'Roboto', sans-serif; /* You might need to import Roboto font globally or via CSS */
  background-color: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 430px;
  margin: 40px auto;
  text-align: center;
}

body {
  background-color: #f8f9fa;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
}

.gsi-material-button {
  -moz-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  -webkit-appearance: none;
  background-color: WHITE;
  background-image: none;
  border: 1px solid #747775;
  -webkit-border-radius: 20px;
  border-radius: 20px;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  color: #1f1f1f;
  cursor: pointer;
  font-family: 'Roboto', arial, sans-serif;
  font-size: 14px;
  height: 40px;
  letter-spacing: 0.25px;
  outline: none;
  overflow: hidden;
  padding: 0 12px;
  position: relative;
  text-align: center;
  -webkit-transition:
    background-color 0.218s,
    border-color 0.218s,
    box-shadow 0.218s;
  transition:
    background-color 0.218s,
    border-color 0.218s,
    box-shadow 0.218s;
  vertical-align: middle;
  white-space: nowrap;
  width: auto;
  max-width: 400px;
  min-width: min-content;
}

.gsi-material-button .gsi-material-button-icon {
  height: 20px;
  margin-right: 12px;
  min-width: 20px;
  width: 20px;
}

.gsi-material-button .gsi-material-button-content-wrapper {
  -webkit-align-items: center;
  align-items: center;
  display: flex;
  -webkit-flex-direction: row;
  flex-direction: row;
  -webkit-flex-wrap: nowrap;
  flex-wrap: nowrap;
  height: 100%;
  justify-content: space-between;
  position: relative;
  width: 100%;
}

.gsi-material-button .gsi-material-button-contents {
  -webkit-flex-grow: 1;
  flex-grow: 1;
  font-family: 'Roboto', arial, sans-serif;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: top;
}

.gsi-material-button .gsi-material-button-state {
  -webkit-transition: opacity 0.218s;
  transition: opacity 0.218s;
  bottom: 0;
  left: 0;
  opacity: 0;
  position: absolute;
  right: 0;
  top: 0;
}

.gsi-material-button:disabled {
  cursor: default;
  background-color: #ffffff61;
  border-color: #1f1f1f1f;
}

.gsi-material-button:disabled .gsi-material-button-contents {
  opacity: 38%;
}

.gsi-material-button:disabled .gsi-material-button-icon {
  opacity: 38%;
}

.gsi-material-button:not(:disabled):active .gsi-material-button-state,
.gsi-material-button:not(:disabled):focus .gsi-material-button-state {
  background-color: #303030;
  opacity: 12%;
}

.gsi-material-button:not(:disabled):hover {
  -webkit-box-shadow:
    0 1px 2px 0 rgba(60, 64, 67, 0.3),
    0 1px 3px 1px rgba(60, 64, 67, 0.15);
  box-shadow:
    0 1px 2px 0 rgba(60, 64, 67, 0.3),
    0 1px 3px 1px rgba(60, 64, 67, 0.15);
}

.gsi-material-button:not(:disabled):hover .gsi-material-button-state {
  background-color: #303030;
  opacity: 8%;
}

.sign-in-buttons {
  display: inline-flex;
  flex-direction: column;
  gap: 12px;
}

.apple-sign-in-button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 16px 0 10px; /* Left is smaller to offset the logo file's ~6px built-in left padding. */
  overflow: hidden;
  border: none;
  border-radius: 20px;
  background-color: #000;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', arial, sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.apple-sign-in-button:hover {
  opacity: 0.85;
}

/* Apple's logo file has built-in padding; HIG says scale it to the button height. */
.apple-sign-in-button-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.message-box {
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 5px;
  padding: 15px;
  margin-top: 25px;
  font-size: 0.95em;
  color: #364f6b;
  text-align: left;
}
</style>
