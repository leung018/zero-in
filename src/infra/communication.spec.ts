import { describe, it, expect } from 'vitest'
import { FakeCommunicationManager, type Port } from './communication'

describe('FakeCommunicationManager', () => {
  it('should clientConnect port can send and receive message to the backgroundPort in listener', () => {
    const fakeCommunicationManager = new FakeCommunicationManager()

    let message1: any, message2: any
    fakeCommunicationManager.addClientConnectListener((backgroundPort) => {
      backgroundPort.onMessage((incomingMessage) => {
        backgroundPort.send(incomingMessage + ' World')
      })
    })

    const clientPort1 = fakeCommunicationManager.clientConnect()
    clientPort1.onMessage((incomingMessage) => {
      message1 = incomingMessage
    })
    clientPort1.send('Hello')

    const clientPort2 = fakeCommunicationManager.clientConnect()
    clientPort2.onMessage((incomingMessage) => {
      message2 = incomingMessage
    })
    clientPort2.send('Hi')

    // each clientPort has unique connection to the backgroundPort, so they won't receive each other message
    expect(message1).toBe('Hello World')
    expect(message2).toBe('Hi World')
  })

  it('should disconnect will disable the communication ', () => {
    const fakeCommunicationManager = new FakeCommunicationManager()

    let lastClientReceivedMsg: any = null
    let lastBackgroundReceivedMsg: any = null
    let backgroundPort: Port = {
      send: () => {},
      onMessage: () => {},
      onDisconnect: () => {}
    }

    fakeCommunicationManager.addClientConnectListener((port) => {
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

    clientPort.send('Hi')
    backgroundPort.send('Hello')

    expect(lastClientReceivedMsg).toBeNull()
    expect(lastBackgroundReceivedMsg).toBeNull()
  })
})
