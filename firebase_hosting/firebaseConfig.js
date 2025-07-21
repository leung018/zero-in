export default {
  // See the comments of src/config.ts for why I can expose the apiKey here.
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCKpyNci-eL6CgHmw0MUqjn8DtVJlaYqDI',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'zero-in-8211f.web.app',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'zero-in-8211f',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'zero-in-8211f.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '54527256719',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:54527256719:web:a04aee2a067e57f4d628fa',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-ZX6X3XNJTP'
}
