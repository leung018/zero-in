import { createBootstrap } from 'bootstrap-vue-next'
import { createApp, type Component } from 'vue'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'

export function mountNewApp(rootComponent: Component, id: string = 'app') {
  const app = createApp(rootComponent)
  app.use(createBootstrap())
  app.mount(`#${id}`)
}
