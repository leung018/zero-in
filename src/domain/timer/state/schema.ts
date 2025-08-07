import type { TimerStage } from '../stage'

export type TimerStateSchemas = [
  {
    remainingSeconds: number
    isRunning: boolean
    stage: TimerStage
    numOfPomodoriCompleted: number
  },
  {
    dataVersion: 1
    remainingSeconds: number
    isRunning: boolean
    stage: TimerStage
    focusSessionsCompleted: number
  },
  {
    dataVersion: 2
    remainingMilliseconds: number
    isRunning: boolean
    stage: TimerStage
    focusSessionsCompleted: number
  },
  {
    dataVersion: 3
    pausedAt: number | null
    endAt: number
    stage: TimerStage
    focusSessionsCompleted: number
  }
]
