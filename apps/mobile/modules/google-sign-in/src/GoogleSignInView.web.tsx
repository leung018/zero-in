import * as React from 'react';

import { GoogleSignInViewProps } from './GoogleSignIn.types';

export default function GoogleSignInView(props: GoogleSignInViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
