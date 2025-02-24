import { createBootstrap } from 'bootstrap-vue-next'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'

import { createApp } from 'vue'
import ReminderApp from './ReminderApp.vue'

const app = createApp(ReminderApp)
app.use(createBootstrap())
app.mount('#app')
