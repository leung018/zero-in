<script setup lang="ts">
import config from '@/config'
import { DailyResetTimeStorageService } from '@/domain/daily_reset_time/storage'
import { NotificationSettingStorageService } from '@/domain/notification_setting/storage'
import { TimerConfigStorageService } from '@/domain/timer/config/storage'
import { FocusSessionRecordsStorageService } from '@/domain/timer/record/storage'
import { BrowserCommunicationManager } from '@/infra/browser/communication'
import { UpdateSuccessNotifierService } from '@/infra/browser/update_success_notifier'
import { FirebaseServices } from '@/infra/firebase/services'
import BlockingSettingPage from '@/pages/BlockingSettingPage/index.vue'
import FeedbackPage from '@/pages/FeedbackPage.vue'
import NotificationPage from '@/pages/NotificationPage.vue'
import StatisticsPage from '@/pages/StatisticsPage.vue'
import TimerSettingPage from '@/pages/TimerSettingPage.vue'
import { onMounted, ref } from 'vue'
import { FeatureFlag, FeatureFlagsService } from '../../infra/feature_flags'

const port = new BrowserCommunicationManager().clientConnect()
const updateSuccessNotifierService = new UpdateSuccessNotifierService()

enum PATH {
  ROOT = '/',
  STATISTICS = '/statistics',
  TIMER_SETTING = '/timer-setting',
  NOTIFICATION = '/notification',
  FEEDBACK = '/feedback'
}

const pathTitles = {
  [PATH.ROOT]: 'Blocking',
  [PATH.STATISTICS]: 'Statistics',
  [PATH.TIMER_SETTING]: 'Timer Setting',
  [PATH.NOTIFICATION]: 'Notification',
  [PATH.FEEDBACK]: 'Feedback'
}

const currentPath = ref<PATH>(PATH.ROOT)

onMounted(() => {
  currentPath.value = getPathFromWindowLocation()
})

window.addEventListener('hashchange', () => {
  currentPath.value = getPathFromWindowLocation()
})

function getPathFromWindowLocation(): PATH {
  const path = window.location.hash.slice(1)
  return Object.values(PATH).includes(path as PATH) ? (path as PATH) : PATH.ROOT
}

const featureFlagsService = FeatureFlagsService.init()
const signInEnabled = ref<boolean>(false)
featureFlagsService.isEnabled(FeatureFlag.SIGN_IN).then((enabled) => {
  signInEnabled.value = enabled
})

const goToSignIn = () => {
  window.location.href = config.getSignInPageUrl()
}

const signOut = () => {
  return FirebaseServices.signOut().then(() => {
    location.reload()
  })
}

const isAuthenticated = ref<boolean>(false)

let authenticationResolved = false
FirebaseServices.isAuthenticated().then((isAuthenticatedValue) => {
  isAuthenticated.value = isAuthenticatedValue
  authenticationResolved = true
})

// This can prevent sometime the isAuthenticated return staled cache value
FirebaseServices.onAuthStateChanged((auth) => {
  const newIsAuthenticated = auth !== null
  if (authenticationResolved && newIsAuthenticated !== isAuthenticated.value) {
    window.location.reload()
  }
})

const mainTabs = [PATH.ROOT, PATH.STATISTICS, PATH.TIMER_SETTING, PATH.NOTIFICATION]
</script>

<template>
  <main>
    <BNav tabs class="mt-2 d-flex w-100">
      <div class="ms-2 d-flex align-items-center" style="width: 100px">
        <div v-if="signInEnabled">
          <BButton
            v-if="!isAuthenticated"
            size="sm"
            class="ms-2"
            variant="warning"
            @click="goToSignIn"
            data-test="sign-in-button"
            >Sign In</BButton
          >
          <BButton v-else size="sm" class="ms-2" @click="signOut" data-test="sign-out-button"
            >Sign Out</BButton
          >
        </div>
      </div>
      <div class="flex-grow-1 d-flex justify-content-center">
        <BNavItem
          v-for="path in mainTabs"
          :key="path"
          :href="`#${path}`"
          :active="path === currentPath"
        >
          {{ pathTitles[path] }}
        </BNavItem>
      </div>
      <div class="me-2" style="width: 100px">
        <BNavItem :active="currentPath === PATH.FEEDBACK" :href="`#${PATH.FEEDBACK}`"
          >Feedback</BNavItem
        >
      </div>
    </BNav>
    <!-- I don't use an approach of mapping component by path here because the current explicit v-if/v-else-if structure 
     preserves TypeScript prop validation for each component -->
    <BlockingSettingPage v-show="currentPath === PATH.ROOT" :port="port" />

    <StatisticsPage
      v-show="currentPath === PATH.STATISTICS"
      :dailyResetTimeStorageService="DailyResetTimeStorageService.create()"
      :updateSuccessNotifierService="updateSuccessNotifierService"
      :focusSessionRecordsStorageService="FocusSessionRecordsStorageService.create()"
    />

    <TimerSettingPage
      v-show="currentPath === PATH.TIMER_SETTING"
      :timerConfigStorageService="TimerConfigStorageService.create()"
      :port="port"
      :updateSuccessNotifierService="updateSuccessNotifierService"
    />

    <NotificationPage
      v-show="currentPath === PATH.NOTIFICATION"
      :notificationSettingStorageService="NotificationSettingStorageService.create()"
      :updateSuccessNotifierService="updateSuccessNotifierService"
      :port="port"
    />

    <FeedbackPage v-show="currentPath === PATH.FEEDBACK" />
  </main>
</template>
