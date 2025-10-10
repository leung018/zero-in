import { requireNativeView } from 'expo';
import * as React from 'react';

import { AppBlockingViewProps } from './AppBlocking.types';

const NativeView: React.ComponentType<AppBlockingViewProps> =
  requireNativeView('AppBlocking');

export default function AppBlockingView(props: AppBlockingViewProps) {
  return <NativeView {...props} />;
}
