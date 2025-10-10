import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './AppBlocking.types';

type AppBlockingModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class AppBlockingModule extends NativeModule<AppBlockingModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(AppBlockingModule, 'AppBlockingModule');
