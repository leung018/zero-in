import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './AppBlocker.types';

type AppBlockerModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class AppBlockerModule extends NativeModule<AppBlockerModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(AppBlockerModule, 'AppBlockerModule');
