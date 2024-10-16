import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import webExtension from 'vite-plugin-web-extension'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), webExtension()]
})
