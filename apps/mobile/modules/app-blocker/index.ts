// Reexport the native module. On web, it will be resolved to AppBlockerModule.web.ts
// and on native platforms to AppBlockerModule.ts
export { default } from './src/AppBlockerModule';
export { default as AppBlockerView } from './src/AppBlockerView';
export * from  './src/AppBlocker.types';
