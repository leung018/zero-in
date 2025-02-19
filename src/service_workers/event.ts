export enum EventName {
  TOGGLE_REDIRECT_RULES,
  POMODORO_START,
  POMODORO_QUERY,
  POMODORO_PAUSE
}

export type EventMap = {
  [EventName.POMODORO_START]: undefined
  [EventName.TOGGLE_REDIRECT_RULES]: undefined
  [EventName.POMODORO_QUERY]: undefined
  [EventName.POMODORO_PAUSE]: undefined
}

export type MappedEvents = {
  [N in EventName]: {
    name: N
    payload: EventMap[N]
  }
}
