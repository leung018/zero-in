export enum WorkRequestName {
  TOGGLE_REDIRECT_RULES,
  START_TIMER,
  LISTEN_TO_TIMER,
  PAUSE_TIMER,
  RESTART_FOCUS
}

export type RestartFocusPayload = {
  numOfFocusCompleted: number
}

export type WorkRequestPayloadMap = {
  [WorkRequestName.TOGGLE_REDIRECT_RULES]: undefined
  [WorkRequestName.START_TIMER]: undefined
  [WorkRequestName.LISTEN_TO_TIMER]: undefined
  [WorkRequestName.PAUSE_TIMER]: undefined
  [WorkRequestName.RESTART_FOCUS]: RestartFocusPayload
}

export type WorkRequest = {
  name: WorkRequestName
  payload?: WorkRequestPayloadMap[WorkRequestName]
}
