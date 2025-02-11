<script setup lang="ts">
import WeeklySchedulesPage from './pages/WeeklySchedulesPage/index.vue'
import { WeeklyScheduleStorageService } from './domain/schedules/storage'
import { MessengerFactory } from './chrome/messenger'
import BlockedDomainsPage from './pages/BlockedDomainsPage.vue'
import { computed, ref, type Component } from 'vue'
import { BrowsingRulesStorageService } from './domain/browsing_rules/storage'

const sender = MessengerFactory.createMessenger()

const routes: { [key: string]: { component: Component; props: object } } = {
  '/': {
    component: WeeklySchedulesPage,
    props: {
      weeklyScheduleStorageService: WeeklyScheduleStorageService.create(),
      sender
    }
  },
  '/blocked-domains': {
    component: BlockedDomainsPage,
    props: {
      browsingRulesStorageService: BrowsingRulesStorageService.create(),
      sender
    }
  }
}

const currentPath = ref(window.location.hash)

window.addEventListener('hashchange', () => {
  currentPath.value = window.location.hash
})

const currentView = computed(() => {
  return routes[currentPath.value.slice(1) || '/'] || routes['/']
})
</script>

<template>
  <main>
    <nav class="navbar navbar-expand navbar-light bg-light">
      <span class="navbar-brand ms-2">Options</span>
      <ul class="navbar-nav">
        <li class="nav-item">
          <a class="nav-link" href="#/">Schedules</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#/blocked-domains">Blocked Domains</a>
        </li>
      </ul>
    </nav>
    <component :is="currentView.component" v-bind="currentView.props" />
  </main>
</template>
