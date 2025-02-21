import type { PomodoroStage } from '../domain/pomodoro/stage'

export type PomodoroTimerResponse = {
  pomodoroState: PomodoroStage
  remainingSeconds: number
  isRunning: boolean
}
