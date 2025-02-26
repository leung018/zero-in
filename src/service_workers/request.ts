export enum WorkRequestName {
  TOGGLE_REDIRECT_RULES,
  START_TIMER,
  LISTEN_TO_TIMER,
  TIMER_PAUSE
}

export type WorkRequest = {
  name: WorkRequestName
}
