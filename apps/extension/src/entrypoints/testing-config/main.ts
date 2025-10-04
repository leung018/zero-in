import { wakeUpServiceWorkerIfIdle } from '../../infra/browser/wake-service-worker'
import { mountNewApp } from '../../mount'
import TestingConfigApp from './App.vue'

// If don't add wakeUpServiceWorkerIfIdle, e2e test will fail in my local environment sometimes when resetting the timer config.
wakeUpServiceWorkerIfIdle().then(() => {
  mountNewApp(TestingConfigApp)
})
