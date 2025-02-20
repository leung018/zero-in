import type { PomodoroState } from '../domain/pomodoro/state'

export type PomodoroTimerResponse = {
  pomodoroState: PomodoroState
  remainingSeconds: number
  isRunning: boolean
}
