// Manual test script: yarn workspace @zero-in/shared send-test-push <expoPushToken> [ios|android]
import { ExpoPushClientImpl, PushPlatform } from '../src/infra/push/expo-push-client'

async function main() {
  const token = process.argv[2]
  const platform = process.argv[3] as PushPlatform | undefined
  if (!token || (platform && platform !== 'ios' && platform !== 'android')) {
    console.error(
      'Usage: yarn workspace @zero-in/shared send-test-push <expoPushToken> [ios|android]'
    )
    process.exit(1)
  }

  const client = new ExpoPushClientImpl()
  const result = await client.send([{ token, platform }])

  console.log('Send result:', result)
}

main()
