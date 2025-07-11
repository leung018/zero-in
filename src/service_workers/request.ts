export enum WorkRequestName {
  TOGGLE_BROWSING_RULES,
  START_TIMER,
  LISTEN_TO_TIMER,
  PAUSE_TIMER,
  RESTART_FOCUS,
  RESTART_SHORT_BREAK,
  RESTART_LONG_BREAK,
  LISTEN_TO_FOCUS_SESSION_RECORDS_UPDATE,
  RESET_TIMER_CONFIG,
  RESET_NOTIFICATION,
  PING,
  AUTH_REQUEST
}

export type RestartNthPayload = {
  nth: number
}

export type WorkRequest =
  | {
      name: WorkRequestName.TOGGLE_BROWSING_RULES
    }
  | {
      name: WorkRequestName.START_TIMER
    }
  | {
      name: WorkRequestName.LISTEN_TO_TIMER
    }
  | {
      name: WorkRequestName.PAUSE_TIMER
    }
  | {
      name: WorkRequestName.RESTART_FOCUS
      payload: RestartNthPayload
    }
  | {
      name: WorkRequestName.RESTART_SHORT_BREAK
      payload: RestartNthPayload
    }
  | {
      name: WorkRequestName.RESTART_LONG_BREAK
    }
  | {
      name: WorkRequestName.LISTEN_TO_FOCUS_SESSION_RECORDS_UPDATE
    }
  | {
      name: WorkRequestName.RESET_TIMER_CONFIG
    }
  | {
      name: WorkRequestName.RESET_NOTIFICATION
    }
  | {
      name: WorkRequestName.PING
    }
  | {
      name: WorkRequestName.AUTH_REQUEST
    }
