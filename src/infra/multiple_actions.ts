import type { ActionService } from './action'

export class MultipleActionService implements ActionService {
  constructor(private actionServices: ActionService[]) {}

  trigger() {
    this.actionServices.forEach((actionService) => actionService.trigger())
  }
}
