import type { ActionService } from '../infra/action'

export class CloseCurrentTabService implements ActionService {
  trigger() {
    window.close()
  }
}
