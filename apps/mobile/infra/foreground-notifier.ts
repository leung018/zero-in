import { AppState } from 'react-native'

export interface ForegroundSubscription {
  remove(): void
}

/**
 * Notifies when the app comes to the foreground, e.g. after returning from system settings.
 */
export interface ForegroundNotifier {
  onForeground(callback: () => void): ForegroundSubscription
}

export const appStateForegroundNotifier: ForegroundNotifier = {
  onForeground(callback: () => void): ForegroundSubscription {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        callback()
      }
    })
    return subscription
  }
}

export class FakeForegroundNotifier implements ForegroundNotifier {
  private callbacks: (() => void)[] = []

  onForeground(callback: () => void): ForegroundSubscription {
    this.callbacks.push(callback)
    return {
      remove: () => {
        this.callbacks = this.callbacks.filter((c) => c !== callback)
      }
    }
  }

  simulateForeground() {
    this.callbacks.forEach((callback) => callback())
  }
}
