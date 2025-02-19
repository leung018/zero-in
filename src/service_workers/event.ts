export enum EventName {
  TOGGLE_REDIRECT_RULES,
  POMODORO_START,
  POMODORO_QUERY,
  POMODORO_PAUSE
}

export type Event = {
  name: EventName
}
