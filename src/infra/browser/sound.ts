import type { ActionService } from '../action'

export class BrowserSoundService implements ActionService {
  // Require manual testing

  trigger(): void {
    browser.offscreen
      .createDocument({
        url: 'offscreen-sound.html',
        reasons: ['AUDIO_PLAYBACK'],
        justification: 'Playing notification sound'
      })
      .then(() => {
        setTimeout(() => {
          browser.offscreen.closeDocument()
        }, 3000) // Remember let it longer than the sound duration
      })
  }
}
