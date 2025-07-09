<script setup lang="ts">
import { DailyResetTimeStorageService } from '@/domain/daily_reset_time/storage'
import { NotificationSettingStorageService } from '@/domain/notification_setting/storage'
import { TimerConfigStorageService } from '@/domain/timer/config/storage'
import { FocusSessionRecordStorageService } from '@/domain/timer/record/storage'
import { BrowserCommunicationManager } from '@/infra/browser/communication'
import { UpdateSuccessNotifierService } from '@/infra/browser/update_success_notifier'
import { CurrentDateService } from '@/infra/current_date'
import BlockingSettingPage from '@/pages/BlockingSettingPage/index.vue'
import FeedbackPage from '@/pages/FeedbackPage.vue'
import NotificationPage from '@/pages/NotificationPage.vue'
import StatisticsPage from '@/pages/StatisticsPage.vue'
import TimerSettingPage from '@/pages/TimerSettingPage.vue'
import { onMounted, ref } from 'vue'

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

const mainTabs = [PATH.ROOT, PATH.STATISTICS, PATH.TIMER_SETTING, PATH.NOTIFICATION]

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

async function firebaseAuth() {
  // await browser.offscreen.closeDocument()
  await browser.offscreen.createDocument({
    url: 'offscreen-signin.html',
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
</script>

<template>
  <main>
    <BNav tabs class="mt-2 d-flex w-100">
      <div class="ms-2 d-flex align-items-center" style="width: 100px">
        <BButton size="sm" class="ms-2" @click="firebaseAuth">Sign In</BButton>
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
