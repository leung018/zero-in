<script setup lang="ts">
import WeeklySchedulesPage from './pages/WeeklySchedulesPage/index.vue'
import { WeeklyScheduleStorageService } from './domain/schedules/storage'
import BlockedDomainsPage from './pages/BlockedDomainsPage.vue'
import StatisticsPage from './pages/StatisticsPage.vue'
import TimerSettingPage from './pages/TimerSettingPage.vue'
import NotificationPage from './pages/NotificationPage.vue'
import { onMounted, ref } from 'vue'
import { BrowsingRulesStorageService } from './domain/browsing_rules/storage'
import { ChromeCommunicationManager } from './chrome/communication'
import { DailyResetTimeStorageService } from './domain/daily_reset_time/storage'
import { ReloadService } from './chrome/reload'
import { FocusSessionRecordStorageService } from './domain/pomodoro/record/storage'
import { TimerConfigStorageService } from './domain/pomodoro/config/storage'
import { CurrentDateService } from './infra/current_date'

const port = new ChromeCommunicationManager().clientConnect()
const reloadService = new ReloadService()

enum PATH {
  ROOT = '/',
  SCHEDULES = '/schedules',
  STATISTICS = '/statistics',
  TIMER_SETTING = '/timer-setting',
  NOTIFICATION = '/notification'
}

const pathTitles = {
  [PATH.ROOT]: 'Blocked Domains',
  [PATH.SCHEDULES]: 'Schedules',
  [PATH.STATISTICS]: 'Statistics',
  [PATH.TIMER_SETTING]: 'Timer Setting',
  [PATH.NOTIFICATION]: 'Notification'
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
</script>

<template>
  <main>
    <BNav tabs class="mt-2 ms-2" align="center">
      <BNavItem
        v-for="path in Object.values(PATH)"
        :key="path"
        :href="`#${path}`"
        :active="path === currentPath"
      >
        {{ pathTitles[path] }}
      </BNavItem>
    </BNav>
    <!-- I don't use an approach of mapping component by path here because the current explicit v-if/v-else-if structure 
     preserves TypeScript prop validation for each component -->
    <BlockedDomainsPage
      v-if="currentPath === PATH.ROOT"
      :browsing-rules-storage-service="BrowsingRulesStorageService.create()"
      :port="port"
    />

    <WeeklySchedulesPage
      v-else-if="currentPath === PATH.SCHEDULES"
      :weekly-schedule-storage-service="WeeklyScheduleStorageService.create()"
      :port="port"
    />

    <StatisticsPage
      v-else-if="currentPath === PATH.STATISTICS"
      :daily-reset-time-storage-service="DailyResetTimeStorageService.create()"
      :reload-service="reloadService"
      :current-date-service="CurrentDateService.create()"
      :focus-session-record-storage-service="FocusSessionRecordStorageService.create()"
      :port="port"
    />

    <TimerSettingPage
      v-else-if="currentPath === PATH.TIMER_SETTING"
      :timer-config-storage-service="TimerConfigStorageService.create()"
      :port="port"
      :reload-service="reloadService"
    />

    <NotificationPage v-else-if="currentPath === PATH.NOTIFICATION" />
  </main>
</template>
