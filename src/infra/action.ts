export interface ActionService {
  trigger(): void
}

export class FakeActionService implements ActionService {
  private _hasTriggered: boolean = false

  trigger() {
    this._hasTriggered = true
  }

  hasTriggered() {
    return this._hasTriggered
  }
}
