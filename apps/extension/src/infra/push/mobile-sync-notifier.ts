import { FirestoreStorage } from '@zero-in/shared/infra/storage/firebase/firestore/storage'
import { FirebaseServices } from '../firebase/services'
import { ExpoPushClient, ExpoPushClientImpl, FakeExpoPushClient } from './expo-push-client'

export interface MobileSyncNotifierDeps {
  getTokenStorage: () => Promise<FirestoreStorage | null>
  pushClient: ExpoPushClient
}

export class MobileSyncNotifier {
  static create(): MobileSyncNotifier {
    return new MobileSyncNotifier({
      getTokenStorage: async () => {
        if (!(await FirebaseServices.isAuthenticated())) return null
        return FirebaseServices.getFirestoreTokenStorage()
      },
      pushClient: new ExpoPushClientImpl()
    })
  }

  static createFake(overrides: Partial<MobileSyncNotifierDeps> = {}): MobileSyncNotifier {
    return new MobileSyncNotifier({
      getTokenStorage: async () => null,
      pushClient: new FakeExpoPushClient(),
      ...overrides
    })
  }

  constructor(private readonly deps: MobileSyncNotifierDeps) {}

  async notify(): Promise<void> {
    const storage = await this.deps.getTokenStorage()
    if (!storage) return

    const snapshots = await storage.list()
    const tokens = snapshots.map((s) => s.id)
    if (!tokens.length) return

    const { deviceNotRegisteredTokens } = await this.deps.pushClient.send(tokens)
    await Promise.all(deviceNotRegisteredTokens.map((t) => storage.delete(t).catch(() => {})))
  }
}
