import type { ActionService } from './action'

export class MultipleActionService implements ActionService {
  constructor(private actionServices: ActionService[]) {}

  async trigger() {
    await Promise.all(this.actionServices.map((actionService) => actionService.trigger()))
  }
}
