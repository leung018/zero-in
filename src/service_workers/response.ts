export enum PomodoroState {
  FOCUS,
  REST
}

export type PomodoroTimerResponse = {
  pomodoroState: PomodoroState
  remainingSeconds: number
  isRunning: boolean
}
