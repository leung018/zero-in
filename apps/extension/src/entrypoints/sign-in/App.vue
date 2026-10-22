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
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="apple-sign-in-button-icon">
        <path
          fill="currentColor"
          d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
        />
      </svg>
      <span>Sign in with Apple</span>
    </button>
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

.apple-sign-in-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 12px auto 0;
  height: 40px;
  padding: 0 16px;
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
  background-color: #333;
}

.apple-sign-in-button-icon {
  width: 16px;
  height: 16px;
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
