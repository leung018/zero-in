import { describe, expect, it } from 'vitest'
import { TimerStage } from '../stage'
import { TimerInternalState } from './internal'

describe('TimerInternalState.equalsIgnoringId', () => {
  it.each([
    [
      TimerInternalState.newTestInstance({
        timerId: '1',
        sessionStartTime: new Date('2023-01-01T00:00:00.000Z'),
        pausedAt: null,
        endAt: new Date('2023-01-01T00:00:10.000Z'),
        stage: TimerStage.FOCUS,
        focusSessionsCompleted: 2
      }),
      TimerInternalState.newTestInstance({
        timerId: '2',
        sessionStartTime: new Date('2023-01-01T00:00:00.000Z'),
        pausedAt: null,
        endAt: new Date('2023-01-01T00:00:10.000Z'),
        stage: TimerStage.FOCUS,
        focusSessionsCompleted: 2
      })
    ],
    [
      TimerInternalState.newTestInstance({
        timerId: '1',
        sessionStartTime: null,
        pausedAt: new Date('2023-01-01T00:00:00.000Z'),
        endAt: new Date('2023-01-01T00:00:10.000Z'),
        stage: TimerStage.LONG_BREAK,
        focusSessionsCompleted: 1
      }),
      TimerInternalState.newTestInstance({
        timerId: '1',
        sessionStartTime: null,
        pausedAt: new Date('2023-01-01T00:00:00.000Z'),
        endAt: new Date('2023-01-01T00:00:10.000Z'),
        stage: TimerStage.LONG_BREAK,
        focusSessionsCompleted: 1
      })
    ]
  ])('should return true when the states are equal', (state1, state2) => {
    expect(state1.equalsIgnoringId(state2)).toBe(true)
  })

  it.each([
    [
      TimerInternalState.newTestInstance({
        sessionStartTime: new Date('2023-01-01T00:00:00.000Z')
      }),
      TimerInternalState.newTestInstance({
        sessionStartTime: new Date('2023-01-01T00:00:01.000Z')
      })
    ],
    [
      TimerInternalState.newTestInstance({
        pausedAt: new Date('2023-01-01T00:00:00.000Z')
      }),
      TimerInternalState.newTestInstance({
        pausedAt: new Date('2023-01-01T00:00:01.000Z')
      })
    ],
    [
      TimerInternalState.newTestInstance({
        endAt: new Date('2023-01-01T00:00:00.000Z')
      }),
      TimerInternalState.newTestInstance({
        endAt: new Date('2023-01-01T00:00:01.000Z')
      })
    ],
    [
      TimerInternalState.newTestInstance({
        stage: TimerStage.FOCUS
      }),
      TimerInternalState.newTestInstance({
        stage: TimerStage.SHORT_BREAK
      })
    ],
    [
      TimerInternalState.newTestInstance({
        focusSessionsCompleted: 1
      }),
      TimerInternalState.newTestInstance({
        focusSessionsCompleted: 2
      })
    ]
  ])('should return false when the states are not equal', (state1, state2) => {
    expect(state1.equalsIgnoringId(state2)).toBe(false)
  })
})
