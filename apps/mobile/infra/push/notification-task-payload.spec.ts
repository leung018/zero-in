import { extractNotificationTaskPayload } from './notification-task-payload'

describe('extractNotificationTaskPayload', () => {
  it('extracts data from the Android shape (JSON-encoded under notification.request.content.dataString)', () => {
    const data = {
      notification: {
        request: {
          content: {
            dataString: JSON.stringify({ kind: 'app-block-sync' })
          }
        }
      }
    }

    expect(extractNotificationTaskPayload(data)).toEqual({ kind: 'app-block-sync' })
  })

  it('extracts data from the iOS shape (JSON-encoded under data.dataString)', () => {
    const data = {
      notification: null,
      data: {
        dataString: JSON.stringify({ kind: 'app-block-sync' })
      }
    }

    expect(extractNotificationTaskPayload(data)).toEqual({ kind: 'app-block-sync' })
  })

  it('returns undefined when no payload is present', () => {
    expect(extractNotificationTaskPayload({ notification: null, data: {} })).toBeUndefined()
  })
})
