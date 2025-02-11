<script setup lang="ts">
import WeeklySchedulesPage from './pages/WeeklySchedulesPage/index.vue'
import { WeeklyScheduleStorageService } from './domain/schedules/storage'
import { MessengerFactory } from './chrome/messenger'
import BlockedDomainsPage from './pages/BlockedDomainsPage.vue'
import { computed, ref, type Component } from 'vue'
import { BrowsingRulesStorageService } from './domain/browsing_rules/storage'

const sender = MessengerFactory.createMessenger()

enum PATH {
  ROOT = '/',
  BLOCKED_DOMAINS = '/blocked-domains'
}

type Route = {
  component: Component
  props: object
  title: string
}

const routeMap: Record<PATH, Route> = {
  [PATH.ROOT]: {
    title: 'Schedules',
    component: WeeklySchedulesPage,
    props: {
      weeklyScheduleStorageService: WeeklyScheduleStorageService.create(),
      sender
    }
  },
  [PATH.BLOCKED_DOMAINS]: {
    title: 'Blocked Domains',
    component: BlockedDomainsPage,
    props: {
      browsingRulesStorageService: BrowsingRulesStorageService.create(),
      sender
    }
  }
}

const currentPath = ref<PATH>(PATH.ROOT)

window.addEventListener('hashchange', () => {
  const newPath = window.location.hash.slice(1)
  if (Object.values(PATH).includes(newPath as PATH)) {
    currentPath.value = newPath as PATH
  } else {
    currentPath.value = PATH.ROOT
  }
})

const currentView = computed(() => {
  return routeMap[currentPath.value]
})
</script>

<template>
  <main>
    <nav class="navbar navbar-expand navbar-light bg-light">
      <span class="navbar-brand ms-2">Options</span>
      <ul class="navbar-nav">
        <li v-for="path in Object.values(PATH)" :key="path" class="nav-item">
          <a class="nav-link" :href="`#${path}`">
            {{ routeMap[path].title }}
          </a>
        </li>
      </ul>
    </nav>
    <component :is="currentView.component" v-bind="currentView.props" />
  </main>
</template>
