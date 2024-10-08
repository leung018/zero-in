export type TaskContent = {
  name: string
}

export type Task = {
  readonly id: string
} & TaskContent
