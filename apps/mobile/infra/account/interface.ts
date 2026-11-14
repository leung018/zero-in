export interface AccountAuth {
  deleteUser(): Promise<void>
}

export class FakeAccountAuth implements AccountAuth {
  private userDeleted = false

  async deleteUser(): Promise<void> {
    this.userDeleted = true
  }

  isUserDeleted(): boolean {
    return this.userDeleted
  }
}
