export enum WorkRequestName {
  TOGGLE_REDIRECT_RULES,
  POMODORO_START,
  POMODORO_QUERY,
  POMODORO_PAUSE
}

export type WorkRequest = {
  name: WorkRequestName
}
