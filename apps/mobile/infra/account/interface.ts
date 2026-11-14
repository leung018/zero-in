export type ReauthResult = 'reauthenticated' | 'cancelled'

export interface AccountAuth {
  reauthenticate(): Promise<ReauthResult>
  deleteUser(): Promise<void>
}

export class FakeAccountAuth implements AccountAuth {
  private readonly reauthResult: ReauthResult
  private userDeleted = false

  constructor({ reauthResult = 'reauthenticated' }: { reauthResult?: ReauthResult } = {}) {
    this.reauthResult = reauthResult
  }

  async reauthenticate(): Promise<ReauthResult> {
    return this.reauthResult
  }

  async deleteUser(): Promise<void> {
    this.userDeleted = true
  }

  isUserDeleted(): boolean {
    return this.userDeleted
  }
}
