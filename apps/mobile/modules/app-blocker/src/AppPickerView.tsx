import { requireNativeViewManager } from 'expo-modules-core'
import { StyleProp, ViewStyle } from 'react-native'

type AppPickerViewProps = {
  style?: StyleProp<ViewStyle>
  onAppsLoaded?: () => void
}

const NativeAppPickerView = requireNativeViewManager('AppBlocker')

export default function AppPickerView({ style, onAppsLoaded }: AppPickerViewProps) {
  return <NativeAppPickerView style={style} onAppsLoaded={onAppsLoaded} />
}
