import { requireNativeViewManager } from 'expo-modules-core'
import { StyleProp, ViewStyle } from 'react-native'

type AppBlockerViewProps = {
  style?: StyleProp<ViewStyle>
}

const NativeAppPickerView = requireNativeViewManager('AppBlocker')

export default function AppPickerView({ style }: AppBlockerViewProps) {
  return <NativeAppPickerView style={style} />
}
