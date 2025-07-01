import { wakeUpServiceWorkerIfIdle } from '../../infra/browser/wake_service_worker'
import { mountNewApp } from '../../mount'
import PopupApp from './App.vue'

wakeUpServiceWorkerIfIdle().then(() => {
  mountNewApp(PopupApp)
})
