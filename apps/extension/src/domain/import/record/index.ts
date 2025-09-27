export enum ImportStatus {
  // Pay attention not to change the order of these enums unless you have consider the data migration of this change.
  NOT_STARTED,
  IMPORTED,
  USER_SKIPPED
}

export type ImportRecord = {
  status: ImportStatus
}

export function newEmptyImportRecord(): ImportRecord {
  return { status: ImportStatus.NOT_STARTED }
}
