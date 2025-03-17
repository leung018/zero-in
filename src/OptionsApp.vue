<script setup lang="ts">
import { WeeklyScheduleStorageService } from './domain/schedules/storage'
import BlockingSettingPage from './pages/BlockingSettingPage.vue'
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
  BLOCKING = '/blocking'
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
  [PATH.BLOCKING]: {
    title: 'Blocking',
    component: BlockingSettingPage,
    props: {
      browsingRulesStorageService: BrowsingRulesStorageService.create(),
      weeklyScheduleStorageService: WeeklyScheduleStorageService.create(),
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
