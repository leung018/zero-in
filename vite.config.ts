import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import webExtension from 'vite-plugin-web-extension'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import IconsResolve from 'unplugin-icons/resolver'
import { BootstrapVueNextResolver } from 'bootstrap-vue-next'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    webExtension({
      additionalInputs: ['reminder.html']
    }),
    Components({
      resolvers: [IconsResolve(), BootstrapVueNextResolver()],
      dts: true
    }),
    Icons({
      compiler: 'vue3',
      autoInstall: true
    })
  ]
})
