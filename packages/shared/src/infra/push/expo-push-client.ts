const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

export interface ExpoPushSendResult {
  deviceNotRegisteredTokens: string[]
}

export type PushPlatform = 'ios' | 'android'

export interface PushTarget {
  token: string
  platform?: PushPlatform
}

export interface ExpoPushClient {
  send(targets: PushTarget[]): Promise<ExpoPushSendResult>
}

export class ExpoPushClientImpl implements ExpoPushClient {
  // Require manual testing
  async send(targets: PushTarget[]): Promise<ExpoPushSendResult> {
    const tokens = targets.map((t) => t.token)
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        tokens.map((to) => ({
          to,
          _contentAvailable: true,
          priority: 'high',
          data: { kind: 'app-block-sync' }
        }))
      )
    })

    if (!response.ok) {
      throw new Error(`Expo push send failed: ${response.status} ${await response.text()}`)
    }
    const body = await response.json()
    return parseExpoPushResponse(body, tokens)
  }
}

export function parseExpoPushResponse(body: any, tokens: string[]): ExpoPushSendResult {
  if (body?.data == null) return { deviceNotRegisteredTokens: [] }
  const tickets: any[] = Array.isArray(body.data) ? body.data : [body.data]
  const deviceNotRegisteredTokens: string[] = []
  tickets.forEach((ticket, i) => {
    if (ticket?.details?.error === 'DeviceNotRegistered' && tokens[i] != null) {
      deviceNotRegisteredTokens.push(tokens[i])
    }
  })
  return { deviceNotRegisteredTokens }
}

export class FakeExpoPushClient implements ExpoPushClient {
  sentTokensCalls: string[][] = []
  sentTargetsCalls: PushTarget[][] = []
  deviceNotRegisteredTokens: string[] = []
  sendError: Error | null = null

  async send(targets: PushTarget[]): Promise<ExpoPushSendResult> {
    const tokens = targets.map((t) => t.token)
    this.sentTokensCalls.push(tokens)
    this.sentTargetsCalls.push(targets)
    if (this.sendError) throw this.sendError
    return {
      deviceNotRegisteredTokens: tokens.filter((t) => this.deviceNotRegisteredTokens.includes(t))
    }
  }
}
