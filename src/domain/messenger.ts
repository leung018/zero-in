import type { Listener } from '../chrome/messenger'

export interface Messenger extends Sender {
  addListener(callback: Listener): void
}

export interface Sender {
  send(message: any): void
}
