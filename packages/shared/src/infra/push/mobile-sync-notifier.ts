import { FakeRemoteStorage } from '../storage/fake'
import { RemoteStorage } from '../storage/interface'
import {
  ExpoPushClient,
  ExpoPushClientImpl,
  FakeExpoPushClient,
  PushPlatform,
  PushTarget
} from './expo-push-client'

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

  // TODO: Make below private; refactor unit tests so they don't need to subclass this for a testable fake.
  constructor(private readonly deps: MobileSyncNotifierDeps) {}

  async register(token: string, platform?: PushPlatform): Promise<void> {
    const storage = await this.deps.getTokenStorage()
    // Using the token as the key means registering the same token twice is a no-op (overwrites the same entry).
    await storage.set(token, platform ? { platform } : {})
  }

  async unregister(token: string): Promise<void> {
    const storage = await this.deps.getTokenStorage()
    await storage.delete(token)
  }

  async notify(): Promise<void> {
    const storage = await this.deps.getTokenStorage()
    const tokens = await storage.getKeys()
    if (!tokens.length) return

    const targets: PushTarget[] = await Promise.all(
      tokens.map(async (token) => {
        const { platform } = (await storage.get(token)) ?? {}
        return platform ? { token, platform } : { token }
      })
    )
    const { deviceNotRegisteredTokens } = await this.deps.pushClient.send(targets)
    await Promise.all(deviceNotRegisteredTokens.map((t) => storage.delete(t)))
  }
}
