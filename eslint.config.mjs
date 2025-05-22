import eslint from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import playwrightPlugin from 'eslint-plugin-playwright'
import eslintPluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import typescriptEslint from 'typescript-eslint'

export default typescriptEslint.config(
  { ignores: ['*.d.ts', '**/coverage', '**/dist'] },
  {
    extends: [
      eslint.configs.recommended,
      ...typescriptEslint.configs.recommended,
      ...eslintPluginVue.configs['flat/recommended']
    ],
    files: ['**/*.{ts,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        parser: typescriptEslint.parser
      }
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off'
    }
  },
  {
    files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    ...playwrightPlugin.configs['flat/recommended']
  },
  eslintConfigPrettier
)
