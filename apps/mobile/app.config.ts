import { ConfigContext, ExpoConfig } from 'expo/config'
import 'tsx/cjs'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Zero In',
  slug: 'zero-in',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'mobile',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'dev.zeroin.mobile',
    googleServicesFile: './GoogleService-Info.plist',
    entitlements: {
      'com.apple.developer.family-controls': true
    },
    appleTeamId: 'YCDM23LPV6'
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png'
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: 'dev.zeroin.mobile',
    googleServicesFile: './google-services.json'
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
        }
      }
    ],
    ['./plugins/withGIDClientID.ts']
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true
  }
})
