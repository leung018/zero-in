// Reexport the native module. On web, it will be resolved to GoogleSignInModule.web.ts
// and on native platforms to GoogleSignInModule.ts
export { default } from './src/GoogleSignInModule';
export { default as GoogleSignInView } from './src/GoogleSignInView';
export * from  './src/GoogleSignIn.types';
