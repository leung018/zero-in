import * as React from 'react';

import { AppBlockingViewProps } from './AppBlocking.types';

export default function AppBlockingView(props: AppBlockingViewProps) {
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
