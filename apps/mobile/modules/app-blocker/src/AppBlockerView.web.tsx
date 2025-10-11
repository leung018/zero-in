import * as React from 'react';

import { AppBlockerViewProps } from './AppBlocker.types';

export default function AppBlockerView(props: AppBlockerViewProps) {
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
