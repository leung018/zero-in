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
      <svg
        class="apple-sign-in-button-icon"
        viewBox="0 0 56 56"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        aria-hidden="true"
      >
        <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
          <rect fill="#000000" x="6" y="6" width="44" height="44"></rect>
          <path
            d="M28.2226562,20.3846154 C29.0546875,20.3846154 30.0976562,19.8048315 30.71875,19.0317864 C31.28125,18.3312142 31.6914062,17.352829 31.6914062,16.3744437 C31.6914062,16.2415766 31.6796875,16.1087095 31.65625,16 C30.7304687,16.0362365 29.6171875,16.640178 28.9492187,17.4494596 C28.421875,18.06548 27.9414062,19.0317864 27.9414062,20.0222505 C27.9414062,20.1671964 27.9648438,20.3121424 27.9765625,20.3604577 C28.0351562,20.3725366 28.1289062,20.3846154 28.2226562,20.3846154 Z M25.2929688,35 C26.4296875,35 26.9335938,34.214876 28.3515625,34.214876 C29.7929688,34.214876 30.109375,34.9758423 31.375,34.9758423 C32.6171875,34.9758423 33.4492188,33.792117 34.234375,32.6325493 C35.1132812,31.3038779 35.4765625,29.9993643 35.5,29.9389701 C35.4179688,29.9148125 33.0390625,28.9122695 33.0390625,26.0979021 C33.0390625,23.6579784 34.9140625,22.5588048 35.0195312,22.474253 C33.7773438,20.6382708 31.890625,20.5899555 31.375,20.5899555 C29.9804688,20.5899555 28.84375,21.4596313 28.1289062,21.4596313 C27.3554688,21.4596313 26.3359375,20.6382708 25.1289062,20.6382708 C22.8320312,20.6382708 20.5,22.5950413 20.5,26.2911634 C20.5,28.5861411 21.3671875,31.013986 22.4335938,32.5842339 C23.3476562,33.9129053 24.1445312,35 25.2929688,35 Z"
            fill="#FFFFFF"
            fill-rule="nonzero"
          ></path>
        </g>
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
  margin: 12px auto 0;
  height: 40px;
  padding: 0 16px 0 0;
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
