import type { ActionService } from '../infra/action'

export class SoundService implements ActionService {
  // Require manual testing

  trigger(): void {
    new Audio(chrome.runtime.getURL('notification.mp3')).play()
  }
}
