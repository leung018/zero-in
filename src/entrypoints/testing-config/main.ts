import { wakeUpServiceWorkerIfIdle } from '../../infra/browser/wake_service_worker'
import { mountNewApp } from '../../mount'
import TestingConfigApp from './App.vue'

wakeUpServiceWorkerIfIdle().then(() => {
  mountNewApp(TestingConfigApp)
})
