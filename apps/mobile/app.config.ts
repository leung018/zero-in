import { ConfigContext, ExpoConfig } from 'expo/config'
import 'tsx/cjs'

const IS_DEV = process.env.APP_VARIANT === 'development'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_DEV ? 'Zero In (Dev)' : 'Zero In',
  slug: 'zero-in',
  extra: {
    eas: {
      projectId: '81a3022e-b587-48a1-9a15-5519aea38362'
    }
  },
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: IS_DEV ? 'mobile-dev' : 'mobile',
  userInterfaceStyle: 'automatic',
  ios: {
    // iOS uses the same bundle identifier for both dev and prod because I'm an Android
    // user and don't need a separate app for development on iOS.
    // When I tried to create a separate bundle identifier for development (like Android),
    // I ran into the following error when running the app:
    //
    // ERROR Failed to request familyControls permission: [Error: Family Controls authorization is available for only one application at a time.]
    //
    // TODO: Create a separate bundle identifier for iOS development (like Android) in the future if needed.
    //       When doing so, note that only the bundle identifier with Family Controls capability
    //       was created on the Apple Developer Console — other configurations may also need to be set up.
    supportsTablet: true,
    bundleIdentifier: 'dev.zeroin.mobile',
    googleServicesFile: process.env.GOOGLE_SERVICES_PLIST || 'GoogleService-Info.plist',
    entitlements: {
      'com.apple.developer.family-controls': true,
      'com.apple.security.application-groups': ['group.dev.zeroin.mobile']
    },
    appleTeamId: 'YCDM23LPV6',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      UIBackgroundModes: ['process']
    }
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png'
    },
    predictiveBackGestureEnabled: false,
    package: IS_DEV ? 'dev.zeroin.mobile.dev' : 'dev.zeroin.mobile',
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON || 'google-services.json'
  },
  plugins: [
    'expo-router',
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
        dark: {
          backgroundColor: '#000000'
        }
      }
    ],
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
          buildReactNativeFromSource: true // Fix similar error as described in https://github.com/expo/expo/issues/39607
        },
        android: {
          targetSdkVersion: 36,
          minSdkVersion: 29
        }
      }
    ],
    ['./plugins/withGIDClientID.ts'],
    '@react-native-community/datetimepicker',
    'expo-font',
    'expo-web-browser',
    '@bacons/apple-targets',
    'expo-background-task',
    'expo-image'
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true
  }
})
