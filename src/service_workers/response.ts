export enum ResponseName {
  POMODORO_TIMER_STATE
}

export type PomodoroTimerStatePayload = {
  remainingSeconds: number
  isRunning: boolean
}

export type ResponseMap = {
  [ResponseName.POMODORO_TIMER_STATE]: PomodoroTimerStatePayload
}

export type MappedResponses = {
  [N in ResponseName]: {
    name: N
    payload: ResponseMap[N]
  }
}
