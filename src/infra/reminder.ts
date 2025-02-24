export interface ReminderService {
  trigger(): void
}

export class FakeReminderService implements ReminderService {
  private triggerCount: number = 0

  trigger() {
    this.triggerCount++
  }

  getTriggerCount() {
    return this.triggerCount
  }
}
