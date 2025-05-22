const { defineConfig } = require('eslint/config')

const js = require('@eslint/js')

const { FlatCompat } = require('@eslint/eslintrc')

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

module.exports = defineConfig([
  {
    extends: compat.extends(
      'plugin:vue/vue3-essential',
      'eslint:recommended',
      '@vue/eslint-config-typescript',
      '@vue/eslint-config-prettier/skip-formatting'
    ),

    languageOptions: {
      ecmaVersion: 'latest',
      parserOptions: {}
    }
  },
  {
    files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    extends: compat.extends('plugin:playwright/recommended')
  },
  {
    files: ['**/*.vue'],

    rules: {
      'vue/multi-word-component-names': 0
    }
  }
])
