import { FakeRemoteStorage } from '../storage/fake'
import { RemoteStorage } from '../storage/interface'
import { ExpoPushClient, ExpoPushClientImpl, FakeExpoPushClient } from './expo-push-client'

interface MobileSyncNotifierDeps {
  getTokenStorage: () => Promise<RemoteStorage>
  pushClient: ExpoPushClient
}

export class MobileSyncNotifier {
  static createFake(overrides: Partial<MobileSyncNotifierDeps> = {}): MobileSyncNotifier {
    const storage = FakeRemoteStorage.create()
    return new MobileSyncNotifier({
      getTokenStorage: async () => storage,
      pushClient: new FakeExpoPushClient(),
      ...overrides
    })
  }

  static create(getTokenStorage: MobileSyncNotifierDeps['getTokenStorage']): MobileSyncNotifier {
    return new MobileSyncNotifier({ getTokenStorage, pushClient: new ExpoPushClientImpl() })
  }

  private constructor(private readonly deps: MobileSyncNotifierDeps) {}

  async register(token: string, platform: string): Promise<void> {
    const storage = await this.deps.getTokenStorage()
    await storage.set(token, { token, platform })
  }

  async unregister(token: string): Promise<void> {
    const storage = await this.deps.getTokenStorage()
    await storage.delete(token)
  }

  async notify(): Promise<void> {
    const storage = await this.deps.getTokenStorage()
    const tokens = await storage.getKeys()
    if (!tokens.length) return

    const { deviceNotRegisteredTokens } = await this.deps.pushClient.send(tokens)
    await Promise.all(deviceNotRegisteredTokens.map((t) => storage.delete(t)))
  }
}
