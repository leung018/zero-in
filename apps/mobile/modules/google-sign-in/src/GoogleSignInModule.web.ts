import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './GoogleSignIn.types';

type GoogleSignInModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class GoogleSignInModule extends NativeModule<GoogleSignInModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(GoogleSignInModule, 'GoogleSignInModule');
