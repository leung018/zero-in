// The implementation of Sender can be used in popup/option page to communicate with listeners in service worker to trigger some background work.
// For the reason why I don't trigger the job in popup/option page directly because it may have bug if rerendering is triggered before that job is finished.

export interface Messenger extends Sender {
  /**
   * Add a listener to listen to messages from sender. Remember to call sendResponse in the callback.
   */
  addListener(callback: Listener): void
}

export type Listener = (message: any, sendResponse: (response?: any) => void) => void

/**
 * Sending message to some listeners in background to notice them do some work
 */
export interface Sender {
  send(message: any): void
}
