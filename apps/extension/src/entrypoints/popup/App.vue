<script setup lang="ts">
import config from '@/config'
import { BrowserCommunicationManager } from '@/infra/browser/communication'
import { BrowserNewTabService } from '@/infra/browser/new-tab'
import FocusTimerPage from '@/pages/FocusTimerPage.vue'
import { FirebaseServices } from '../../infra/firebase/services'

const openOptionsPage = () => {
  browser.runtime.openOptionsPage()
}

const openSignInPage = () => {
  new BrowserNewTabService(config.getSignInPageUrl()).trigger()
}

const isAuthenticated = ref<boolean>(false)

FirebaseServices.isAuthenticated().then((isAuthenticatedValue) => {
  isAuthenticated.value = isAuthenticatedValue
})
</script>

<template>
  <div class="position-relative">
    <BButton
      v-if="!isAuthenticated"
      data-test="sign-in-button"
      variant="outline-secondary"
      class="position-absolute top-0 start-0 p-0 ms-2"
      @click="openSignInPage"
    >
      <IIcBaselineAccountCircle />
    </BButton>
    <BButton
      data-test="options-button"
      @click="openOptionsPage"
      class="position-absolute top-0 end-0 p-0 me-2"
      variant="outline-secondary"
    >
      <IIcBaselineSettings />
    </BButton>
    <FocusTimerPage :port="new BrowserCommunicationManager().clientConnect()" />
  </div>
</template>
