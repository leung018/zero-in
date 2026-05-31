const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

export interface ExpoPushSendResult {
  deviceNotRegisteredTokens: string[]
}

export interface ExpoPushClient {
  send(tokens: string[]): Promise<ExpoPushSendResult>
}

export class ExpoPushClientImpl implements ExpoPushClient {
  async send(tokens: string[]): Promise<ExpoPushSendResult> {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        tokens.map((to) => ({
          to,
          _contentAvailable: true,
          data: { kind: 'app-block-sync' }
        }))
      )
    })

    if (!response.ok) return { deviceNotRegisteredTokens: [] }
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
  deviceNotRegisteredTokens: string[] = []
  sendError: Error | null = null

  async send(tokens: string[]): Promise<ExpoPushSendResult> {
    this.sentTokensCalls.push(tokens)
    if (this.sendError) throw this.sendError
    return {
      deviceNotRegisteredTokens: tokens.filter((t) => this.deviceNotRegisteredTokens.includes(t))
    }
  }
}
