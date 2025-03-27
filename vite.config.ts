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
      additionalInputs: ['reminder.html', 'testing-config.html']
    }),
    Components({
      resolvers: [IconsResolve(), BootstrapVueNextResolver()],
      dts: true
    }),
    Icons({
      compiler: 'vue3',
      autoInstall: true
    })
  ],
  build: {
    rollupOptions: {
      output: {
        sanitizeFileName(name) {
          // Below is copied from https://github.com/rollup/rollup/blob/master/src/utils/sanitizeFileName.ts
          // with the only modification changing the replacement character from '_' to '-'.
          // Because Chrome doesn't allow '_' in the file name

          // eslint-disable-next-line no-control-regex
          const INVALID_CHAR_REGEX = /[\u0000-\u001F"#$%&*+,:;<=>?[\]^`{|}\u007F]/g
          const DRIVE_LETTER_REGEX = /^[a-z]:/i

          const match = DRIVE_LETTER_REGEX.exec(name)
          const driveLetter = match ? match[0] : ''

          return driveLetter + name.slice(driveLetter.length).replace(INVALID_CHAR_REGEX, '-')
        }
      }
    }
  }
})
