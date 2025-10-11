import { requireNativeView } from 'expo';
import * as React from 'react';

import { AppBlockerViewProps } from './AppBlocker.types';

const NativeView: React.ComponentType<AppBlockerViewProps> =
  requireNativeView('AppBlocker');

export default function AppBlockerView(props: AppBlockerViewProps) {
  return <NativeView {...props} />;
}
