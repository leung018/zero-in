export enum WorkRequestName {
  TOGGLE_REDIRECT_RULES,
  START_TIMER,
  LISTEN_TO_TIMER,
  PAUSE_TIMER
}

export type WorkRequest = {
  name: WorkRequestName
}
