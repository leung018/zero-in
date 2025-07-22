<script setup lang="ts">
import { DailyResetTimeStorageService } from '@/domain/daily_reset_time/storage'
import { NotificationSettingStorageService } from '@/domain/notification_setting/storage'
import { TimerConfigStorageService } from '@/domain/timer/config/storage'
import { FocusSessionRecordStorageService } from '@/domain/timer/record/storage'
import { BrowserCommunicationManager } from '@/infra/browser/communication'
import { UpdateSuccessNotifierService } from '@/infra/browser/update_success_notifier'
import { CurrentDateService } from '@/infra/current_date'
import { FirebaseServices } from '@/infra/firebase_services'
import BlockingSettingPage from '@/pages/BlockingSettingPage/index.vue'
import FeedbackPage from '@/pages/FeedbackPage.vue'
import NotificationPage from '@/pages/NotificationPage.vue'
import StatisticsPage from '@/pages/StatisticsPage.vue'
import TimerSettingPage from '@/pages/TimerSettingPage.vue'
import { User } from 'firebase/auth'
import { onMounted, ref } from 'vue'
import { FeatureFlagsService } from '../../infra/feature_flags'

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
featureFlagsService.isEnabled('sign-in').then((enabled) => {
  signInEnabled.value = enabled
})

const goToSignIn = () => {
  window.location.href = browser.runtime.getURL('/sign-in.html')
}

const signOut = () => {
  return FirebaseServices.signOut().then(() => {
    location.reload()
  })
}

const user = ref<User | null>(null)

onBeforeMount(async () => {
  user.value = await FirebaseServices.getCurrentUser()
})

const mainTabs = [PATH.ROOT, PATH.STATISTICS, PATH.TIMER_SETTING, PATH.NOTIFICATION]
</script>

<template>
  <main>
    <BNav tabs class="mt-2 d-flex w-100">
      <div class="ms-2 d-flex align-items-center" style="width: 100px">
        <div v-if="signInEnabled">
          <BButton
            v-if="!user"
            size="sm"
            class="ms-2"
            @click="goToSignIn"
            data-test="sign-in-button"
            >Sign In</BButton
          >
          <BButton
            v-else
            size="sm"
            class="ms-2"
            variant="warning"
            @click="signOut"
            data-test="sign-out-button"
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
    <BlockingSettingPage v-if="currentPath === PATH.ROOT" :port="port" />

    <StatisticsPage
      v-else-if="currentPath === PATH.STATISTICS"
      :daily-reset-time-storage-service="DailyResetTimeStorageService.create()"
      :update-success-notifier-service="updateSuccessNotifierService"
      :current-date-service="CurrentDateService.create()"
      :focus-session-record-storage-service="FocusSessionRecordStorageService.create()"
      :port="port"
    />

    <TimerSettingPage
      v-else-if="currentPath === PATH.TIMER_SETTING"
      :timer-config-storage-service="TimerConfigStorageService.create()"
      :port="port"
      :update-success-notifier-service="updateSuccessNotifierService"
    />

    <NotificationPage
      v-else-if="currentPath === PATH.NOTIFICATION"
      :notification-setting-storage-service="NotificationSettingStorageService.create()"
      :update-success-notifier-service="updateSuccessNotifierService"
      :port="port"
    />

    <FeedbackPage v-else-if="currentPath === PATH.FEEDBACK" />
  </main>
</template>
