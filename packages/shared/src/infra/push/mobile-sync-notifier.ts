import { ExpoPushClient, FakeExpoPushClient } from './expo-push-client'

export interface TokenStoragePort {
  set(key: string, value: any): Promise<void>
  delete(key: string): Promise<void>
  list(): Promise<{ id: string }[]>
}

export interface MobileSyncNotifierDeps {
  getTokenStorage: () => Promise<TokenStoragePort | null>
  pushClient?: ExpoPushClient
}

export class MobileSyncNotifier {
  static createFake(overrides: Partial<MobileSyncNotifierDeps> = {}): MobileSyncNotifier {
    return new MobileSyncNotifier({
      getTokenStorage: async () => null,
      pushClient: new FakeExpoPushClient(),
      ...overrides
    })
  }

  constructor(private readonly deps: MobileSyncNotifierDeps) {}

  async register(token: string, platform: string): Promise<void> {
    const storage = await this.deps.getTokenStorage()
    if (!storage) return
    await storage.set(token, { token, platform })
  }

  async unregister(token: string): Promise<void> {
    const storage = await this.deps.getTokenStorage()
    if (!storage) return
    await storage.delete(token)
  }

  async notify(): Promise<void> {
    const storage = await this.deps.getTokenStorage()
    if (!storage || !this.deps.pushClient) return

    const tokens = (await storage.list()).map((s) => s.id)
    if (!tokens.length) return

    const { deviceNotRegisteredTokens } = await this.deps.pushClient.send(tokens)
    await Promise.all(deviceNotRegisteredTokens.map((t) => storage.delete(t).catch(() => {})))
  }
}
