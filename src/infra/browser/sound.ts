import type { ActionService } from '../action'

export class ChromeSoundService implements ActionService {
  // Require manual testing

  trigger(): void {
    chrome.offscreen
      .createDocument({
        url: 'offscreen.html',
        reasons: ['AUDIO_PLAYBACK'],
        justification: 'Playing notification sound'
      })
      .then(() => {
        setTimeout(() => {
          chrome.offscreen.closeDocument()
        }, 3000) // Remember let it longer than the sound duration
      })
  }
}
