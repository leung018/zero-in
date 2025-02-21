import type { PomodoroStage } from '../domain/pomodoro/stage'

export type PomodoroTimerResponse = {
  stage: PomodoroStage
  remainingSeconds: number
  isRunning: boolean
}
