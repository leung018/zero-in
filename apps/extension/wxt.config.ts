import { BootstrapVueNextResolver } from 'bootstrap-vue-next'
import path from 'path'
import IconsResolve from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  srcDir: 'src',
  outDir: 'dist',
  zip: {
    artifactTemplate: 'zero-in-{{browser}}.zip'
  },
  manifestVersion: 3,
  manifest: {
    minimum_chrome_version: '116',
    name: 'Zero In - Boost Your Focus' + (process.env.NAME_SUFFIX || ''),
    description:
      'Helps you stay focused and productive with a customizable timer and website blocker —— great for work or study.',
    version: process.env.VERSION || '0.1',
    version_name: process.env.VERSION_NAME || process.env.TAG_NAME || 'local',
    action: {
      default_popup: 'popup.html'
    },
    icons: {
      128: 'icon.png'
    },
    background: {
      service_worker: 'src/service_workers/index.ts'
    },
    options_page: 'options.html',
    permissions: ['storage', 'alarms', 'notifications', 'tabs', 'contextMenus', 'offscreen'],
    web_accessible_resources: [
      {
        resources: ['blocked.html'], // Making blocked template accessible can solve the problem of clicking the blocked domain from the google search results triggering ERR_BLOCKED_BY_CLIENT.
        matches: ['<all_urls>']
      }
    ]
  },
  vite: () => ({
    resolve: {
      alias: {
        '@zero-in/shared': path.resolve(__dirname, '../../packages/shared/src')
      }
    },
    plugins: [
      Icons({
        compiler: 'vue3',
        autoInstall: true
      }),
      Components({
        resolvers: [IconsResolve(), BootstrapVueNextResolver()],
        dts: true
      }) as any
    ],
    build: {
      chunkSizeWarningLimit: 1500
    }
  }),
  webExt: {
    chromiumArgs: ['--disable-blink-features=AutomationControlled'] // Prevent I can't google login when running wxt in dev mode
  }
})
