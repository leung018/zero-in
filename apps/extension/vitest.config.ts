import vue from '@vitejs/plugin-vue'
import { BootstrapVueNextResolver } from 'bootstrap-vue-next'
import path from 'path'
import IconsResolve from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    vue() as any,
    Components({
      resolvers: [IconsResolve(), BootstrapVueNextResolver()],
      dts: true
    }),
    Icons({
      compiler: 'vue3',
      autoInstall: true
    })
  ],
  test: {
    projects: [
      './',
      {
        extends: true,
        test: {
          include: ['src/**/*.{test,spec}.ts'],
          exclude: [...configDefaults.exclude, 'e2e/**', 'src/**/*.integration.{test,spec}.ts'],
          name: 'unit'
        }
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['src/**/*.integration.{test,spec}.ts'],
          exclude: [...configDefaults.exclude, 'e2e/**'],
          env: {
            VITE_USE_FIREBASE_EMULATOR: 'true'
          }
        }
      }
    ],
    coverage: {
      include: ['src/**']
    },
    setupFiles: ['./test-setup.ts'],
    environment: 'jsdom'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
