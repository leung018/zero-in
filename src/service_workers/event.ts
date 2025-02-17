export enum EventName {
  TOGGLE_REDIRECT_RULES = 'toggleRedirectRules',
  POMODORO_START = 'pomodoroStart'
}

export type PomodoroStartPayload = {
  initialSeconds: number
}

export type EventMap = {
  [EventName.POMODORO_START]: PomodoroStartPayload
  [EventName.TOGGLE_REDIRECT_RULES]: undefined
}

export type MappedEvents = {
  [N in EventName]: {
    name: N
    payload: EventMap[N]
  }
}
