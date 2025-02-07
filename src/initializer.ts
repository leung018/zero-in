import { ChromeMessenger } from './chrome/messenger'
import { RedirectTogglingService } from './domain/redirect_toggling'
import { EventName } from './event'

export class MessageListenersInitializer {
  redirectTogglingService: RedirectTogglingService
  chromeMessenger: ChromeMessenger

  static initListeners({
    redirectTogglingService
  }: {
    redirectTogglingService: RedirectTogglingService
  }) {
    new MessageListenersInitializer({
      redirectTogglingService,
      chromeMessenger: ChromeMessenger.create()
    }).initListeners()
  }

  static initFakeListeners({
    redirectTogglingService = RedirectTogglingService.createFake(),
    chromeMessenger = ChromeMessenger.createFake()
  } = {}) {
    new MessageListenersInitializer({
      redirectTogglingService,
      chromeMessenger
    }).initListeners()
  }

  private constructor({
    redirectTogglingService,
    chromeMessenger
  }: {
    redirectTogglingService: RedirectTogglingService
    chromeMessenger: ChromeMessenger
  }) {
    this.redirectTogglingService = redirectTogglingService
    this.chromeMessenger = chromeMessenger
  }

  private initListeners() {
    this.chromeMessenger.addListener((message, sendResponse) => {
      if (message.name == EventName.TOGGLE_REDIRECT_RULES) {
        this.redirectTogglingService.run().then(() => {
          sendResponse()
        })
      }
    })
  }
}
