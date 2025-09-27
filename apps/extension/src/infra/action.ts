export interface ActionService {
  trigger(): Promise<void>
}

export class FakeActionService implements ActionService {
  private _hasTriggered: boolean = false

  async trigger() {
    this._hasTriggered = true
  }

  hasTriggered() {
    return this._hasTriggered
  }
}
