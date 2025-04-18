import type { PomodoroStage } from '../stage'

export type TimerState = {
  remainingSeconds: number
  isRunning: boolean
  stage: PomodoroStage
  numOfPomodoriCompleted: number
}
