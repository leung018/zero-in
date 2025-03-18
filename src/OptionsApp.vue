<script setup lang="ts">
import WeeklySchedulesPage from './pages/WeeklySchedulesPage/index.vue'
import { WeeklyScheduleStorageService } from './domain/schedules/storage'
import BlockedDomainsPage from './pages/BlockedDomainsPage.vue'
import StatisticsPage from './pages/StatisticsPage.vue'
import { computed, onMounted, ref, type Component } from 'vue'
import { BrowsingRulesStorageService } from './domain/browsing_rules/storage'
import { ChromeCommunicationManager } from './chrome/communication'
import { DailyCutoffTimeStorageService } from './domain/daily_cutoff_time/storage'
import { ReloadService } from './chrome/reload'
import { PomodoroRecordStorageService } from './domain/pomodoro/record/storage'

const port = new ChromeCommunicationManager().clientConnect()

enum PATH {
  ROOT = '/',
  BLOCKED_DOMAINS = '/blocked-domains',
  SCHEDULES = '/schedules'
}

type Route = {
  component: Component
  props: object
  title: string
}

const routeMap: Record<PATH, Route> = {
  [PATH.ROOT]: {
    title: 'Statistics',
    component: StatisticsPage,
    props: {
      dailyCutoffTimeStorageService: DailyCutoffTimeStorageService.create(),
      reloadService: new ReloadService(),
      currentDate: new Date(),
      pomodoroRecordStorageService: PomodoroRecordStorageService.create()
    }
  },
  [PATH.SCHEDULES]: {
    title: 'Schedules',
    component: WeeklySchedulesPage,
    props: {
      weeklyScheduleStorageService: WeeklyScheduleStorageService.create(),
      port
    }
  },
  [PATH.BLOCKED_DOMAINS]: {
    title: 'Blocked Domains',
    component: BlockedDomainsPage,
    props: {
      browsingRulesStorageService: BrowsingRulesStorageService.create(),
      port
    }
  }
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

const currentView = computed(() => {
  return routeMap[currentPath.value]
})
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
        {{ routeMap[path].title }}
      </BNavItem>
    </BNav>
    <component :is="currentView.component" v-bind="currentView.props" />
  </main>
</template>
