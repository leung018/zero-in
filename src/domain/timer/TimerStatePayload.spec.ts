import { describe, expect, it } from 'vitest'
import { TimerStatePayload } from '.'
import { Duration } from './duration'
import { TimerStage } from './stage'

describe('TimerStatePayload', () => {
  const fixedDate = new Date('2024-01-01T12:00:00Z')
  const endDate = new Date('2024-01-01T12:25:00Z') // 25 minutes later

  it('should create instance with all properties', () => {
    const payload = new TimerStatePayload({
      pausedAt: fixedDate,
      endAt: endDate,
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 2
    })

    expect(payload.pausedAt).toEqual(fixedDate)
    expect(payload.endAt).toEqual(endDate)
    expect(payload.stage).toBe(TimerStage.FOCUS)
    expect(payload.focusSessionsCompleted).toBe(2)
  })

  it('should return correct running state when pausedAt is undefined', () => {
    const payload = new TimerStatePayload({
      pausedAt: undefined,
      endAt: endDate,
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 0
    })

    expect(payload.isRunning()).toBe(true)
  })

  it('should return correct running state when pausedAt is defined', () => {
    const payload = new TimerStatePayload({
      pausedAt: fixedDate,
      endAt: endDate,
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 0
    })

    expect(payload.isRunning()).toBe(false)
  })

  it('should calculate remaining time when paused', () => {
    const payload = new TimerStatePayload({
      pausedAt: fixedDate,
      endAt: endDate,
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 0
    })

    const remaining = payload.remaining()
    expect(remaining).toEqual(new Duration({ minutes: 25 })) // 25 minutes
  })

  it('should calculate remaining time when running', () => {
    const currentTime = new Date('2024-01-01T12:05:00Z') // 5 minutes after start
    const payload = new TimerStatePayload({
      pausedAt: undefined,
      endAt: endDate,
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 0
    })

    const remaining = payload.remaining(currentTime)
    expect(remaining).toEqual(new Duration({ minutes: 20 })) // 20 minutes remaining
  })

  it('should create updated instance with withUpdate', () => {
    const original = new TimerStatePayload({
      pausedAt: fixedDate,
      endAt: endDate,
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 1
    })

    const updated = original.withUpdate({
      stage: TimerStage.SHORT_BREAK,
      focusSessionsCompleted: 0
    })

    expect(updated.stage).toBe(TimerStage.SHORT_BREAK)
    expect(updated.focusSessionsCompleted).toBe(0)
    expect(updated.pausedAt).toEqual(fixedDate) // unchanged
    expect(updated.endAt).toEqual(endDate) // unchanged
  })

  it('should convert to timer state correctly', () => {
    const payload = new TimerStatePayload({
      pausedAt: fixedDate,
      endAt: endDate,
      stage: TimerStage.SHORT_BREAK,
      focusSessionsCompleted: 3
    })

    const timerState = payload.toTimerState()

    expect(timerState.stage).toBe(TimerStage.SHORT_BREAK)
    expect(timerState.focusSessionsCompleted).toBe(3)
    expect(timerState.isRunning).toBe(false)
    expect(timerState.remaining).toEqual(new Duration({ minutes: 25 }))
  })

  it('should convert to timer state correctly if running', () => {
    const payload = new TimerStatePayload({
      pausedAt: undefined,
      endAt: endDate,
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 0
    })

    const timerState = payload.toTimerState(new Date('2024-01-01T12:12:00Z'))
    expect(timerState.isRunning).toBe(true)
    expect(timerState.remaining).toEqual(new Duration({ minutes: 13 }))
  })

  it('should remaining is 0 if now exceed endAt', () => {
    const payload = new TimerStatePayload({
      pausedAt: undefined,
      endAt: new Date('2024-01-01T12:00:00Z'),
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 0
    })

    const remaining = payload.remaining(new Date('2024-01-01T12:05:00Z'))
    expect(remaining.isZero()).toBe(true)
  })
})
