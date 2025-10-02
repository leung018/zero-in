import { describe, expect, it } from 'vitest'
import { FakeCommunicationManager, type Port } from './communication'

describe('FakeCommunicationManager', () => {
  it('should clientConnect port can send and receive message to the backgroundPort in listener', async () => {
    const fakeCommunicationManager = new FakeCommunicationManager()

    let message1: any, message2: any
    fakeCommunicationManager.onNewClientConnect((backgroundPort) => {
      backgroundPort.onMessage((incomingMessage) => {
        backgroundPort.send(incomingMessage + ' World')
      })
    })

    const clientPort1 = fakeCommunicationManager.clientConnect()
    clientPort1.onMessage((incomingMessage) => {
      message1 = incomingMessage
    })
    await clientPort1.send('Hello')

    const clientPort2 = fakeCommunicationManager.clientConnect()
    clientPort2.onMessage((incomingMessage) => {
      message2 = incomingMessage
    })
    await clientPort2.send('Hi')

    // each clientPort has unique connection to the backgroundPort, so they won't receive each other message
    expect(message1).toBe('Hello World')
    expect(message2).toBe('Hi World')
  })

  it('should disconnect will disable the communication ', async () => {
    const fakeCommunicationManager = new FakeCommunicationManager()

    let lastClientReceivedMsg: any = null
    let lastBackgroundReceivedMsg: any = null
    let backgroundPort: Port

    fakeCommunicationManager.onNewClientConnect((port) => {
      port.onMessage((incomingMessage) => {
        lastBackgroundReceivedMsg = incomingMessage
      })
      backgroundPort = port
    })

    const clientPort = fakeCommunicationManager.clientConnect()
    clientPort.onMessage((incomingMessage) => {
      lastClientReceivedMsg = incomingMessage
    })
    clientPort.disconnect()

    await clientPort.send('Hi')
    // @ts-expect-error Below variable should be assigned in above callback. So disable the type check for this line
    await backgroundPort.send('Hello')

    expect(lastClientReceivedMsg).toBeNull()
    expect(lastBackgroundReceivedMsg).toBeNull()
  })

  it('should disconnect trigger onDisconnect callback of connected port', async () => {
    const fakeCommunicationManager = new FakeCommunicationManager()

    let isOnDisconnectCalled = false

    fakeCommunicationManager.onNewClientConnect((port) => {
      port.onDisconnect(() => {
        isOnDisconnectCalled = true
      })
    })

    const clientPort = fakeCommunicationManager.clientConnect()
    clientPort.disconnect()

    expect(isOnDisconnectCalled).toBe(true)
  })

  it('should deep clone messages (no reference sharing)', async () => {
    const fakeCommunicationManager = new FakeCommunicationManager()
    let received: any
    fakeCommunicationManager.onNewClientConnect((backgroundPort) => {
      backgroundPort.onMessage((msg) => {
        received = msg
      })
    })

    const clientPort = fakeCommunicationManager.clientConnect()
    const obj = { a: 1 }
    await clientPort.send(obj)
    // Mutate original object after sending
    obj.a = 2

    expect(received).toEqual({ a: 1 })
  })

  it('should throw error if send sth non-JSON-serializable', async () => {
    const fakeCommunicationManager = new FakeCommunicationManager()
    const clientPort = fakeCommunicationManager.clientConnect()

    await expect(clientPort.send(() => {})).rejects.toThrowError()
  })
})
