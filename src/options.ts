import { createBootstrap } from 'bootstrap-vue-next'
import WeeklySchedulesPage from './pages/WeeklySchedulesPage/index.vue'
import BlockedDomainsPage from './pages/BlockedDomainsPage.vue'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'

import { createApp } from 'vue'
import OptionsApp from './OptionsApp.vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import { WeeklyScheduleStorageService } from './domain/schedules/storage'
import { MessengerFactory } from './chrome/messenger'
import { BrowsingRulesStorageService } from './domain/browsing_rules/storage'

const routes = [
  {
    path: '/schedules',
    component: WeeklySchedulesPage,
    props: {
      weeklyScheduleStorageService: WeeklyScheduleStorageService.create(),
      sender: MessengerFactory.createMessenger()
    }
  },
  {
    path: '/',
    redirect: '/schedules'
  },
  {
    path: '/blocked-domains',
    component: BlockedDomainsPage,
    props: {
      sender: MessengerFactory.createMessenger(),
      browsingRulesStorageService: BrowsingRulesStorageService.create()
    }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

const app = createApp(OptionsApp)
app.use(router)
app.use(createBootstrap())
app.mount('#app')
