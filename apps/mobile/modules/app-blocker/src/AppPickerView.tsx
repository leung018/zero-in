import { requireNativeViewManager } from 'expo-modules-core'
import { useCallback } from 'react'
import { StyleProp, ViewStyle } from 'react-native'

type AppBlockerViewProps = {
  style?: StyleProp<ViewStyle>
  selectedApps?: string[]
  onSelectionChange?: (event: { nativeEvent: { apps: string[]; count: number } }) => void
}

const NativeAppPickerView = requireNativeViewManager('AppBlocker')

export default function AppPickerView({
  style,
  selectedApps = [],
  onSelectionChange
}: AppBlockerViewProps) {
  const handleSelectionChange = useCallback(
    (event: any) => {
      onSelectionChange?.(event)
    },
    [onSelectionChange]
  )

  return (
    <NativeAppPickerView
      style={style}
      selectedApps={selectedApps}
      onSelectionChange={handleSelectionChange}
    />
  )
}
