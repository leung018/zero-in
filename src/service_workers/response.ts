export enum ResponseName {
  POMODORO_TIMER_UPDATE = 'pomodoroTimerUpdate'
}

export type PomodoroTimerUpdatePayload = {
  remainingSeconds: number
}

export type ResponseMap = {
  [ResponseName.POMODORO_TIMER_UPDATE]: PomodoroTimerUpdatePayload
}

export type MappedResponses = {
  [N in ResponseName]: {
    name: N
    payload: ResponseMap[N]
  }
}
