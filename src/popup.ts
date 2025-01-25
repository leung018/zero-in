import { createBootstrap } from 'bootstrap-vue-next'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'

import { createApp } from 'vue'
import App from './PopupApp.vue'

const app = createApp(App)
app.use(createBootstrap())
app.mount('#app')
