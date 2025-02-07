import { MessengerFactory } from './chrome/messenger'
import { type Messenger } from './domain/messenger'
import { RedirectTogglingService } from './domain/redirect_toggling'
import { EventName } from './event'

export class MessageListenersInitializer {
  private redirectTogglingService: RedirectTogglingService
  private messenger: Messenger

  static initListeners({
    redirectTogglingService
  }: {
    redirectTogglingService: RedirectTogglingService
  }) {
    new MessageListenersInitializer({
      redirectTogglingService,
      messenger: MessengerFactory.createMessenger()
    }).initListeners()
  }

  static initFakeListeners({
    redirectTogglingService = RedirectTogglingService.createFake(),
    messenger = MessengerFactory.createFakeMessenger()
  } = {}) {
    new MessageListenersInitializer({
      redirectTogglingService,
      messenger
    }).initListeners()
  }

  private constructor({
    redirectTogglingService,
    messenger
  }: {
    redirectTogglingService: RedirectTogglingService
    messenger: Messenger
  }) {
    this.redirectTogglingService = redirectTogglingService
    this.messenger = messenger
  }

  private initListeners() {
    this.messenger.addListener((message, sendResponse) => {
      if (message.name == EventName.TOGGLE_REDIRECT_RULES) {
        this.redirectTogglingService.run().then(() => {
          sendResponse()
        })
      }
    })
  }
}
