import { requireNativeView } from 'expo';
import * as React from 'react';

import { GoogleSignInViewProps } from './GoogleSignIn.types';

const NativeView: React.ComponentType<GoogleSignInViewProps> =
  requireNativeView('GoogleSignIn');

export default function GoogleSignInView(props: GoogleSignInViewProps) {
  return <NativeView {...props} />;
}
