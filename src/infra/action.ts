export interface ActionService {
  trigger(): void
}

export class FakeActionService implements ActionService {
  private triggerCount: number = 0

  trigger() {
    this.triggerCount++
  }

  getSimulatedTriggerCount() {
    return this.triggerCount
  }

  hasTriggered() {
    return this.triggerCount > 0
  }
}
