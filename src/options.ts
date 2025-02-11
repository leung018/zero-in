import { createBootstrap } from 'bootstrap-vue-next'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'

import { createApp } from 'vue'
import OptionsApp from './OptionsApp.vue'

const app = createApp(OptionsApp)
app.use(createBootstrap())
app.mount('#app')
