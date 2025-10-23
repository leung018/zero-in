import { requireNativeViewManager } from 'expo-modules-core'
import { StyleProp, ViewStyle } from 'react-native'

type AppPickerViewProps = {
  style?: StyleProp<ViewStyle>
}

const NativeAppPickerView = requireNativeViewManager('AppBlocker')

export default function AppPickerView({ style }: AppPickerViewProps) {
  return <NativeAppPickerView style={style} />
}
