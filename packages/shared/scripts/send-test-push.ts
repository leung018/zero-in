// Manual test script: yarn workspace @zero-in/shared send-test-push <expoPushToken>
import { ExpoPushClientImpl } from '../src/infra/push/expo-push-client'

async function main() {
  const token = process.argv[2]
  if (!token) {
    console.error('Usage: yarn workspace @zero-in/shared send-test-push <expoPushToken>')
    process.exit(1)
  }

  const client = new ExpoPushClientImpl()
  const result = await client.send([token])

  console.log('Send result:', result)
}

main()
